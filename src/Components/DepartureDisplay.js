/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState, useRef } from "react";
import DepartureTable from "./DepartureTable";
import {
  ApiError,
  getDepartures,
  isAbortError,
  isUnavailableError,
  toColumnData,
} from "../api";
import { getTranslation } from "../dictionary";

// Departures are fetched every two minutes; this reduces load on the API.
const REFRESH_INTERVAL_MS = 120000;
// Between fetches the minutes are recomputed from the loaded departures.
const COUNTDOWN_INTERVAL_MS = 10000;
// A tab that becomes visible again fetches at once if its data is older.
const RESUME_MAX_AGE_MS = 30000;

// Why a station's departures could not be loaded, as a dictionary key.
const classifyFetchError = (error) => {
  if (!(error instanceof ApiError)) return "statusInvalidResponse";
  if (error.status === 0) return "statusApiUnreachable";
  if (error.status === 429) return "statusRateLimited";
  return "statusApiError";
};

const DepartureDisplay = (props) => {
  // Departures per station as the API returned them.
  const [departures, setDepartures] = useState([]);
  // The time the minutes on the board are computed for.
  const [now, setNow] = useState(() => Date.now());
  // null until the first round of fetches settles; then { failures, total }.
  const [fetchStatus, setFetchStatus] = useState(null);
  const controllerRef = useRef(null);
  // Last successful departures per station, used when a single station fails.
  const lastResultsRef = useRef([]);
  // When the last round started and when a round last delivered departures.
  const lastAttemptRef = useRef(-Infinity);
  const lastSuccessRef = useRef(-Infinity);

  const columnData = useMemo(
    () => toColumnData(departures, new Date(now)),
    [departures, now],
  );

  useEffect(() => {
    lastResultsRef.current = [];
    setFetchStatus(null);
  }, [props.selectedStations]);

  // Fetches at once and then every REFRESH_INTERVAL_MS, but only while the
  // tab is visible. A hidden tab sends no requests.
  useEffect(() => {
    if (props.selectedStations.length === 0) {
      setDepartures([]);
      return undefined;
    }

    let timer;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
      fetchDataForSelectedStations();
    };
    const handleVisibilityChange = () => {
      clearTimeout(timer);
      if (document.hidden) return;
      // Fetch at once if the departures are too old, otherwise stay on the
      // rhythm of the last fetch. A failed round counts as well, so that
      // switching tabs quickly never causes a burst of requests.
      const current = Date.now();
      const age =
        current - Math.max(lastAttemptRef.current, lastSuccessRef.current);
      if (age > RESUME_MAX_AGE_MS) {
        refresh();
      } else {
        const sinceAttempt = current - lastAttemptRef.current;
        timer = setTimeout(
          refresh,
          Math.max(0, REFRESH_INTERVAL_MS - sinceAttempt),
        );
      }
    };

    // Changed stations or settings always need new departures; a hidden tab
    // fetches them as soon as it becomes visible.
    lastAttemptRef.current = -Infinity;
    lastSuccessRef.current = -Infinity;
    if (!document.hidden) refresh();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controllerRef.current?.abort();
    };
  }, [props.selectedStations, props.language, props.standardRemarksVisibility]);

  // Keeps the countdown running between fetches without any request, and
  // brings it up to date as soon as the tab becomes visible again.
  useEffect(() => {
    let interval;
    const start = () => {
      clearInterval(interval);
      if (document.hidden) return;
      setNow(Date.now());
      interval = setInterval(() => setNow(Date.now()), COUNTDOWN_INTERVAL_MS);
    };

    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  const fetchDataForSelectedStations = async () => {
    // A new round aborts the previous one if it is still running.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    lastAttemptRef.current = Date.now();

    const results = await Promise.allSettled(
      props.selectedStations.map((station) =>
        getDepartures(station, {
          language: props.language,
          standardRemarks: props.standardRemarksVisibility,
          signal: controller.signal,
        }),
      ),
    );
    if (controller.signal.aborted) return;

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason)
      .filter((err) => !isAbortError(err));
    errors.forEach((err) => console.error("Error fetching departures:", err));

    // Each station on its own: a failing station keeps its last departures,
    // the others are updated.
    const loaded = results.map((r, i) =>
      r.status === "fulfilled" ? r.value : lastResultsRef.current[i] ?? [],
    );
    lastResultsRef.current = loaded;
    if (results.some((r) => r.status === "fulfilled")) {
      lastSuccessRef.current = Date.now();
    }

    props.onApiAvailabilityChange?.(!errors.some(isUnavailableError));
    setDepartures(loaded);
    setNow(Date.now());
    setFetchStatus({
      failures: errors.map(classifyFetchError),
      total: results.length,
    });
  };

  // A line for the board explaining what it shows, or why it shows nothing.
  const getStatusMessage = () => {
    const t = (key) => getTranslation(props.language, key);
    if (props.selectedStations.length === 0) return t("statusNoStations");
    if (!fetchStatus) return columnData.length === 0 ? t("statusLoading") : null;

    const { failures, total } = fetchStatus;
    if (failures.length > 0) {
      const reasons = [...new Set(failures)].map(t).join(" / ");
      if (failures.length === total) return reasons;
      return `${failures.length}/${total} ${t("statusSomeStationsFailed")}: ${reasons}`;
    }
    return columnData.length === 0 ? t("statusNoDepartures") : null;
  };

  return (
    <div>
      <DepartureTable
        fontSize={props.fontSize}
        dataSource={columnData}
        remarksVisibility={props.remarksVisibility}
        hideDepartureCol={props.hideDepartureCol}
        language={props.language}
        statusMessage={getStatusMessage()}
      />
    </div>
  );
};

export default DepartureDisplay;
