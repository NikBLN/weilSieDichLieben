/* eslint-disable no-loop-func */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import DepartureTable from "./DepartureTable";

const DepartureDisplay = (props) => {
  const [columnData, setColumnData] = useState([]);
  const departureDataRef = useRef([]);
  const fetchCounter = useRef(0);
  const fetchIsInProgress = useRef(false);

  useEffect(() => {
    let interval;
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

  const fetchDataForSelectedStations = () => {
    if (fetchIsInProgress.current) return;

    fetchIsInProgress.current = true;
    departureDataRef.current = [];
    fetchCounter.current = 0;
    for (let i = 0; i < props.selectedStations.length; i++) {
      const selectedStation = props.selectedStations[i];
      fetchDeparturesAtStop(selectedStation);
    }
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

  const handleFetchResponse = (res) => {
    if (fetchCounter.current >= props.selectedStations.length) return;

    fetchCounter.current += 1;
    departureDataRef.current.push(res);

    if (fetchCounter.current === props.selectedStations.length) {
      const columnData = getColumnData(departureDataRef.current);
      setColumnData(columnData);
      fetchIsInProgress.current = false;
    }
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

    try {
      let url;
      let response;
      const now = new Date();
      const later = new Date(now.getTime() + when * 60000);
      const formattedTime = later.toLocaleTimeString("de-DE", {
        hour12: false,
      });

      if (destination) {
        url = `https://v6.bvg.transport.rest/journeys?language=${props.language}&from=${stationId}&to=${destination.id}&departure=${formattedTime}&results=${results}&suburban=${suburban}&subway=${subway}&tram=${tram}&bus=${bus}&ferry=${ferry}&express=${express}&regional=${regional}&remarks=${props.standardRemarksVisibility}`;
        response = await fetch(url);
        const data = await response.json();
        handleFetchResponse(convertJourneyResultToDepartureData(data.journeys));
      } else {
        url = `https://v6.bvg.transport.rest/stops/${stationId}/departures?language=${props.language}&when=${formattedTime}&results=${results}&suburban=${suburban}&subway=${subway}&tram=${tram}&bus=${bus}&ferry=${ferry}&express=${express}&regional=${regional}&remarks=${props.standardRemarksVisibility}`;
        response = await fetch(url);
        const data = await response.json();
        handleFetchResponse(data);
      }
    } catch (error) {
      console.error("Error fetching departures:", error);
      fetchIsInProgress.current = false;
    }
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
