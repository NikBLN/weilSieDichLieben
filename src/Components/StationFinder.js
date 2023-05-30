import { AutoComplete, message } from "antd";
import React, { useDeferredValue, useEffect, useState } from "react";

const StationFinder = (props) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState();
  const deferredOptions = useDeferredValue(options);
  const [queryStr, setQueryStr] = useState("");
  const baseFetchUrl =
    "https://v6.db.transport.rest/locations?poi=false&addresses=false&query=";

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

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Station erfolgreich hinzugefügt!",
    });
  };

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
          when: null,
          results: 4,
          suburban: true,
          subway: true,
          tram: true,
          bus: true,
          ferry: true,
          express: true,
          regional: true,
        };
      })
    );
  };

  return (
    <>
      {contextHolder}
      <AutoComplete
        value={value}
        style={{ width: 200 }}
        options={deferredOptions}
        onSelect={(_, option) => {
          props.onSelect(option);
          setValue("");
          setOptions([]);
          success();
        }}
        onSearch={(text) => {
          setQueryStr(text);
          setValue(text);
        }}
      />
    </>
  );
};

export default StationFinder;
