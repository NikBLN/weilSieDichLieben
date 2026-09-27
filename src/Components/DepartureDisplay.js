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
    // Eine neue Runde bricht die vorige ab, falls sie noch läuft.
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

    if (errors.length > 0) {
      // Bei Fehlern bleibt die letzte Anzeige stehen.
      errors.forEach((err) => console.error("Error fetching departures:", err));
      if (errors.some(isUnavailableError)) props.onApiAvailabilityChange?.(false);
      return;
    }

    props.onApiAvailabilityChange?.(true);
    setColumnData(toColumnData(results.map((r) => r.value)));
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
