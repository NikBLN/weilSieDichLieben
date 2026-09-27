/* eslint-disable react-hooks/exhaustive-deps */
import { AutoComplete, message } from "antd";
import React, { useDeferredValue, useEffect, useState } from "react";
import { getTranslation } from "../dictionary";
import { isAbortError, searchStations } from "../api";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

const StationFinder = (props) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState();
  const deferredOptions = useDeferredValue(options);
  const [queryStr, setQueryStr] = useState("");

  useEffect(() => {
    const query = queryStr.trim();
    if (query.length < MIN_QUERY_LENGTH) return undefined;

    // Neue Eingabe bricht die vorige Suche ab.
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchStations(query, {
        language: props.language,
        signal: controller.signal,
      })
        .then(prepareOptionsData)
        .catch((err) => {
          if (!isAbortError(err)) console.error("Error searching stations:", err);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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
