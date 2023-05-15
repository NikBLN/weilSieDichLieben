/* eslint-disable no-loop-func */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import DepartureTable from "./DepartureTable";

const DepartureDisplay = (props) => {
  const [columnData, setColumnData] = useState([]);
  const departureDataRef = useRef([]);
  const fetchCounter = useRef(0);

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
  }, [props.selectedStations, props.departureAmount, props.departureWhen]);

  const fetchDataForSelectedStations = () => {
    departureDataRef.current = [];
    fetchCounter.current = 0;
    for (let i = 0; i < props.selectedStations.length; i++) {
      const selectedStation = props.selectedStations[i];
      fetchDeparturesAtStop(selectedStation.id);
    }
  };

  const fetchDeparturesAtStop = (stationId) => {
    const now = new Date();
    const later = new Date(
      now.getTime() + (props.departureWhen ? props.departureWhen : 0) * 60000
    );
    const formattedTime = later.toLocaleTimeString("de-DE", {
      hour12: false,
    });
    const baseFetchUrl = `https://v6.bvg.transport.rest/stops/STATIONID/departures?when=${formattedTime}&results=${
      props.departureAmount ? props.departureAmount : 0
    }`;
    const fetchUrl = baseFetchUrl.replace("STATIONID", stationId);
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((res) => {
        fetchCounter.current += 1;
        departureDataRef.current.push(res);
        if (fetchCounter.current === props.selectedStations.length) {
          // answer for all stations received -> set column data
          const data = getColumnData(departureDataRef.current);
          setColumnData(data);
        }
      });
  };

  const getColumnData = (data) => {
    const columnData = [];

    for (let i = 0; i < data.length; i++) {
      const stationData = data[i];
      for (let j = 0; j < stationData.departures.length; j++) {
        const departure = stationData.departures[j];
        const now = new Date();
        const whenDate = new Date(departure.when);
        const diffInMinutes = Math.floor(
          (whenDate.getTime() - now.getTime()) / 60000
        );

        columnData.push({
          key: `${departure.stop.id}_${j}`,
          lineName: departure.line.name,
          direction: departure.direction,
          departureName: departure.stop.name,
          when: diffInMinutes,
        });
      }
    }

    return columnData;
  };

  const columns = [
    {
      title: "Linie",
      dataIndex: "lineName",
      key: "lineName",
    },
    {
      title: "Richtung",
      dataIndex: "direction",
      key: "direction",
    },
    {
      title: "Abfahrt von",
      dataIndex: "departureName",
      key: "departureName",
    },
    {
      title: "Abfahrt in",
      dataIndex: "when",
      key: "when",
      defaultSortOrder: "ascend",
      sorter: (a, b) => a.when - b.when,
      render: (text) => <div>{text > 0 ? text : "Jetzt"}</div>,
    },
  ];

  return (
    <div>
      <DepartureTable columns={columns} dataSource={columnData} />
    </div>
  );
};

export default DepartureDisplay;
