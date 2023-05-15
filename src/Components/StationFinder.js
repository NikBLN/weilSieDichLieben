import { AutoComplete } from "antd";
import React, { useDeferredValue, useEffect, useState } from "react";

const StationFinder = (props) => {
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState();
  const deferredOptions = useDeferredValue(options);
  const [queryStr, setQueryStr] = useState("");
  const baseFetchUrl =
    "https://v6.bvg.transport.rest/locations?poi=false&addresses=false&query=";

  useEffect(() => {
    const fetchUrl = baseFetchUrl + queryStr;
    if (queryStr !== "") {
      fetch(fetchUrl)
        .then((res) => res.json())
        .then((res) => {
          prepareOptionsData(res);
        });
    }
  }, [queryStr]);

  const prepareOptionsData = (data) => {
    setOptions(
      data.map((dataSet) => {
        return {
          value: dataSet.name,
          id: dataSet.id,
          disabled:
            props.selectedStations.filter(
              (station) => station.id === dataSet.id
            ).length > 0,
        };
      })
    );
  };

  return (
    <AutoComplete
      value={value}
      style={{ width: 200 }}
      options={deferredOptions}
      onSelect={(_, option) => {
        props.onSelect(option);
        setValue("");
        setOptions([]);
      }}
      onSearch={(text) => {
        setQueryStr(text);
        setValue(text);
      }}
    />
  );
};

export default StationFinder;
