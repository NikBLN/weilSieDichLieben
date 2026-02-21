/* eslint-disable react-hooks/exhaustive-deps */
import { AutoComplete, message } from "antd";
import React, { useDeferredValue, useEffect, useState } from "react";
import { getTranslation } from "../dictionary";

const StationFinder = (props) => {
  const [messageApi, contextHolder] = message.useMessage();
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

  const success = () => {
    messageApi.open({
      type: "success",
      content: getTranslation(props.language, "stationsSuccessfullyChanged"),
    });
  };

  const prepareOptionsData = (data) => {
    setOptions(
      data.map((dataSet) => {
        return {
          value: dataSet.name,
          id: dataSet.id,
          when: 0,
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
        placeholder={getTranslation(props.language, "searchStation")}
        allowClear={props.allowClear}
        value={value || props.initialValue || ""}
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
          // If user is typing and we have an initial value, clear the selection
          if (props.initialValue && text !== props.initialValue) {
            props.onSelect(null);
          }
        }}
        onClear={() => {
          setQueryStr("");
          setValue("");
          setOptions([]);
          props.onSelect(null);
        }}
      />
    </>
  );
};

export default StationFinder;
