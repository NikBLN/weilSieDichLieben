/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import DepartureTable from "./DepartureTable";
import {
  getDepartures,
  isAbortError,
  isUnavailableError,
  toColumnData,
} from "../api";

const REFRESH_INTERVAL_MS = 60000;

const DepartureDisplay = (props) => {
  const [columnData, setColumnData] = useState([]);
  const controllerRef = useRef(null);
  // Last successful departures per station, used when a single station fails.
  const lastResultsRef = useRef([]);

  useEffect(() => {
    lastResultsRef.current = [];
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
  };

  return (
    <div>
      <DepartureTable
        fontSize={props.fontSize}
        dataSource={columnData}
        remarksVisibility={props.remarksVisibility}
        hideDepartureCol={props.hideDepartureCol}
        language={props.language}
      />
    </div>
  );
};

export default DepartureDisplay;
