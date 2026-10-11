/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import DepartureTable from "./DepartureTable";
import {
  ApiError,
  getDepartures,
  isAbortError,
  isUnavailableError,
  toColumnData,
} from "../api";
import { getTranslation } from "../dictionary";

const REFRESH_INTERVAL_MS = 60000;

// Why a station's departures could not be loaded, as a dictionary key.
const classifyFetchError = (error) => {
  if (!(error instanceof ApiError)) return "statusInvalidResponse";
  if (error.status === 0) return "statusApiUnreachable";
  if (error.status === 429) return "statusRateLimited";
  return "statusApiError";
};

const DepartureDisplay = (props) => {
  const [columnData, setColumnData] = useState([]);
  // null until the first round of fetches settles; then { failures, total }.
  const [fetchStatus, setFetchStatus] = useState(null);
  const controllerRef = useRef(null);
  // Last successful departures per station, used when a single station fails.
  const lastResultsRef = useRef([]);

  useEffect(() => {
    lastResultsRef.current = [];
    setFetchStatus(null);
  }, [props.selectedStations]);

  useEffect(() => {
    let interval;
    if (props.selectedStations.length > 0) {
      fetchDataForSelectedStations();
      interval = setInterval(fetchDataForSelectedStations, REFRESH_INTERVAL_MS);
    } else {
      setColumnData([]);
    }
    return () => {
      clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [props.selectedStations, props.language, props.standardRemarksVisibility]);

  const fetchDataForSelectedStations = async () => {
    // A new round aborts the previous one if it is still running.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

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
    const departures = results.map((r, i) =>
      r.status === "fulfilled" ? r.value : lastResultsRef.current[i] ?? [],
    );
    lastResultsRef.current = departures;

    props.onApiAvailabilityChange?.(!errors.some(isUnavailableError));
    setColumnData(toColumnData(departures));
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
