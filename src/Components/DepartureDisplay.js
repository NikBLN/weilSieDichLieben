/* eslint-disable no-loop-func */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import DepartureTable from "./DepartureTable";
import { getTranslation } from "../dictionary";

let lastLoggedFetchError = null;
const logFetchError = (error) => {
  const message = error?.message || String(error);
  if (message === lastLoggedFetchError) return;
  lastLoggedFetchError = message;
  console.error("Error fetching departures:", error);
};

// Why a station's departures could not be loaded, as a dictionary key.
const classifyFetchError = (error) => {
  if (error?.status === 429) return "statusRateLimited";
  if (error?.status) return "statusApiError";
  if (error instanceof SyntaxError) return "statusInvalidResponse";
  return "statusApiUnreachable";
};

const DepartureDisplay = (props) => {
  const [columnData, setColumnData] = useState([]);
  // null until the first round of fetches settles; then { failures, total }.
  const [fetchStatus, setFetchStatus] = useState(null);
  const fetchIsInProgress = useRef(false);
  const fetchGeneration = useRef(0);

  useEffect(() => {
    let interval;
    fetchGeneration.current += 1;
    fetchIsInProgress.current = false;
    setFetchStatus(null);
    if (props.selectedStations.length > 0) {
      fetchDataForSelectedStations();
      interval = setInterval(() => {
        fetchDataForSelectedStations();
      }, 60000);
    } else {
      setColumnData([]);
    }
    return () => {
      clearInterval(interval);
    };
  }, [props.selectedStations]);

  // Fetch every station, then show whatever arrived. A station that fails no
  // longer holds back the others; its failure is reported on the board.
  const fetchDataForSelectedStations = async () => {
    if (fetchIsInProgress.current) return;
    fetchIsInProgress.current = true;
    const generation = fetchGeneration.current;

    const results = await Promise.allSettled(
      props.selectedStations.map(fetchDeparturesAtStop)
    );
    // The stations changed while this round was in flight.
    if (generation !== fetchGeneration.current) return;
    fetchIsInProgress.current = false;

    const failures = [];
    const data = [];
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        data.push(result.value);
      } else {
        logFetchError(result.reason);
        failures.push(classifyFetchError(result.reason));
      }
    });

    // When every station failed, keep the last good rows rather than blanking
    // the board on a single hiccup; the status line still says what happened.
    if (data.length > 0 || failures.length === 0) {
      setColumnData(getColumnData(data));
    }
    setFetchStatus({ failures, total: results.length });
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, {
      headers: { "User-Agent": "https://weilsiedichlieben.de" },
    });
    if (!response.ok) {
      const error = new Error(
        `HTTP ${response.status} ${response.statusText} from ${url}`
      );
      error.status = response.status;
      throw error;
    }
    return response.json();
  };

  const convertJourneyResultToDepartureData = (journeys) => {
    const departures = [];
    for (let i = 0; i < journeys.length; i++) {
      const journey = journeys[i];
      const legs = journey.legs;
      if (legs == null || legs.length === 0) continue;

      const firstLeg = legs?.[0];

      const departure = {
        stop: {
          id: firstLeg.origin.id,
          name: firstLeg.origin.name,
          location: firstLeg.origin.location,
        },
        line: {
          name: firstLeg.line.name,
        },
        tripId: firstLeg.tripId || firstLeg.trip?.id,
        direction: firstLeg.direction,
        when: firstLeg.departure,
        remarks: firstLeg.remarks,
      };

      departures.push(departure);
    }

    return {
      departures: departures,
    };
  };

  const fetchDeparturesAtStop = async (station) => {
    const {
      id: stationId,
      destination,
      when = 0,
      results,
      suburban,
      subway,
      tram,
      bus,
      ferry,
      express,
      regional,
    } = station;

    const now = new Date();
    const later = new Date(now.getTime() + when * 60000);
    const formattedTime = later.toLocaleTimeString("de-DE", {
      hour12: false,
    });

    if (destination) {
      const url = `https://v6.bvg.transport.rest/journeys?language=${props.language}&from=${stationId}&to=${destination.id}&departure=${formattedTime}&results=${results}&suburban=${suburban}&subway=${subway}&tram=${tram}&bus=${bus}&ferry=${ferry}&express=${express}&regional=${regional}&remarks=${props.standardRemarksVisibility}`;
      const data = await fetchJson(url);
      return convertJourneyResultToDepartureData(data.journeys ?? []);
    }
    const url = `https://v6.bvg.transport.rest/stops/${stationId}/departures?language=${props.language}&when=${formattedTime}&results=${results}&suburban=${suburban}&subway=${subway}&tram=${tram}&bus=${bus}&ferry=${ferry}&express=${express}&regional=${regional}&remarks=${props.standardRemarksVisibility}`;
    const data = await fetchJson(url);
    return { departures: data.departures ?? [] };
  };

  const getColumnData = (data) => {
    const columnData = [];

    for (let i = 0; i < data.length; i++) {
      const stationData = data[i];
      for (let j = 0; j < stationData.departures.length; j++) {
        const departure = stationData.departures[j];
        const now = new Date();
        const whenDate = departure.when ? new Date(departure.when) : null;
        const diffInMinutes = whenDate
          ? Math.floor((whenDate.getTime() - now.getTime()) / 60000)
          : null;

        columnData.push({
          key: `${i}_${departure.stop.id}_${j}`,
          lineName: departure.line.name,
          direction: departure.direction,
          departureName: departure.stop.name,
          when: diffInMinutes,
          remarks: departure.remarks,
          tripId: departure.tripId || departure.trip?.id,
          stopId: departure.stop.id,
          stopLocation: departure.stop.location,
        });
      }
    }

    return columnData;
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
