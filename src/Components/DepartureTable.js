import { Row, Col } from "antd";
import React, { useState } from "react";
import Marquee from "react-fast-marquee";
import { getTranslation } from "../dictionary";
import StatusRow from "./StatusRow";
import useIsMobile from "../hooks/useIsMobile";

const DepartureTable = (props) => {
  const [isPaused, setIsPaused] = useState(false);
  const [sortOrder, setSortOrder] = useState("off");
  const [sortField, setSortField] = useState("departureName");
  const isMobile = useIsMobile();
  const FONTSIZE = props.fontSize;
  const FONTFAMILYNAME = "DotMatrix";
  const whenHeaderKey = props.hideDepartureCol ? "departure" : "when";

  const mobileFontSize = isMobile ? FONTSIZE * 0.85 : FONTSIZE;

  const styles = {
    columnName: {
      fontSize: mobileFontSize,
      fontFamily: FONTFAMILYNAME,
    },
    column: {
      color: "orange",
      fontSize: mobileFontSize,
      fontFamily: FONTFAMILYNAME,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: isMobile ? "nowrap" : "normal",
    },
    headerRow: {
      backgroundColor: "lightGray",
      padding: isMobile ? "4px 8px" : "8px",
      position: "sticky",
      top: -8,
      zIndex: 5,
    },
    dataRow: {
      backgroundColor: "black",
      padding: isMobile ? "4px 8px" : "8px",
    },
    marquee: {
      color: "orange",
      fontSize: isMobile ? FONTSIZE * 0.7 : FONTSIZE * 0.8,
      fontFamily: FONTFAMILYNAME,
      backgroundColor: "black",
    },
    columnNameClickable: {
      fontSize: mobileFontSize,
      fontFamily: FONTFAMILYNAME,
      cursor: "pointer",
      userSelect: "none",
    },
    groupHeader: {
      backgroundColor: "#333",
      color: "orange",
      padding: "6px 8px",
      fontSize: mobileFontSize * 0.9,
      fontFamily: FONTFAMILYNAME,
      borderTop: "2px solid orange",
    },
  };

  const sanitizeHTML = (html) => {
    const allowedTags = {
      a: {
        href: /^https?:\/\/.+/i,
        target: "_blank",
        rel: "noopener noreferrer",
        class: "remark-link",
      },
      b: {},
      i: {},
      em: {},
      strong: {},
    };

    return html.replace(
      /<(\/?)([a-z0-9]+)([^>]*?)>/gi,
      (match, closing, tag, attrs) => {
        tag = tag.toLowerCase();

        if (!allowedTags[tag]) {
          return "";
        }

        if (closing) {
          return `</${tag}>`;
        }

        if (tag === "a") {
          const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
          if (hrefMatch && allowedTags.a.href.test(hrefMatch[1])) {
            return `<a href="${hrefMatch[1]}" target="_blank" rel="noopener noreferrer" class="remark-link">`;
          }
          return "";
        }

        return `<${tag}>`;
      },
    );
  };

  const processRemarks = (remarks) => {
    if (!remarks?.length) return "";
    return remarks.map((remark) => remark.text).join(" *** ");
  };

  const handleSort = (field) => {
    if (field !== sortField) {
      setSortField(field);
      setSortOrder("asc");
    } else {
      setSortOrder((current) => {
        switch (current) {
          case "off":
            return "asc";
          case "asc":
            return "desc";
          case "desc":
            return "off";
          default:
            return "off";
        }
      });
    }
  };

  const getSortedData = () => {
    if (sortOrder === "off")
      return [...props.dataSource].sort((a, b) => a.when - b.when);

    return [...props.dataSource].sort((a, b) => {
      const comparison = a[sortField].localeCompare(b[sortField]);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  // Group data by departureName for mobile view
  const getGroupedData = () => {
    const sortedData = getSortedData();
    const groups = {};

    sortedData.forEach((item) => {
      const key = item.departureName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  };

  const renderMobileRow = (data) => {
    const remarkText = processRemarks(data.remarks);
    return (
      <div key={data.key} style={{ display: "flex", flexDirection: "column" }}>
        <Row style={styles.dataRow}>
          <Col style={styles.column} span={4}>
            {data.lineName}
          </Col>
          <Col style={styles.column} span={12}>
            {data.direction}
          </Col>
          <Col style={{ ...styles.column, textAlign: "right" }} span={8}>
            {data.when == null
              ? getTranslation(props.language, "cancelled")
              : data.when > 0
              ? `${data.when} ${getTranslation(props.language, "minutes")}`
              : getTranslation(props.language, "now")}
          </Col>
        </Row>
        {remarkText && props.remarksVisibility && (
          <Marquee
            speed={30}
            play={!isPaused}
            style={styles.marquee}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <span
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(remarkText) }}
              onClick={(e) => e.target.tagName === "A" && e.stopPropagation()}
            />
          </Marquee>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: isMobile ? "8px" : "16px",
        paddingTop: "0px",
        borderRadius: "8px",
      }}
    >
      <style>
        {`
          .remark-link, .remark-link:visited, .remark-link:hover, .remark-link:active {
            color: #FFA500 !important;
            text-decoration: underline !important;
            cursor: pointer;
          }
        `}
      </style>

      {/* Desktop Header */}
      {!isMobile && (
        <Row style={styles.headerRow}>
          <Col style={styles.columnName} span={4}>
            {getTranslation(props.language, "line")}
          </Col>
          <Col
            style={styles.columnNameClickable}
            span={props.hideDepartureCol ? 16 : 9}
            onClick={() => handleSort("direction")}
          >
            {getTranslation(props.language, "direction")}{" "}
            {sortField === "direction" &&
              sortOrder !== "off" &&
              (sortOrder === "asc" ? "↑" : "↓")}
          </Col>
          {!props.hideDepartureCol && (
            <Col
              style={styles.columnNameClickable}
              span={9}
              onClick={() => handleSort("departureName")}
            >
              {getTranslation(props.language, "departureName")}{" "}
              {sortField === "departureName" &&
                sortOrder !== "off" &&
                (sortOrder === "asc" ? "↑" : "↓")}
            </Col>
          )}
          <Col
            style={{ ...styles.columnName, position: "relative" }}
            span={props.hideDepartureCol ? 4 : 2}
          >
            <span style={{ position: "absolute", right: 0, whiteSpace: "nowrap" }}>
              {getTranslation(props.language, whenHeaderKey)}
            </span>
          </Col>
        </Row>
      )}

      {/* Mobile Header - without "Abfahrt von" */}
      {isMobile && (
        <Row style={styles.headerRow}>
          <Col style={styles.columnName} span={4}>
            {getTranslation(props.language, "line")}
          </Col>
          <Col style={styles.columnName} span={12}>
            {getTranslation(props.language, "direction")}
          </Col>
          <Col style={{ ...styles.columnName, textAlign: "right" }} span={8}>
            {getTranslation(props.language, whenHeaderKey)}
          </Col>
        </Row>
      )}

      {props.statusMessage && (
        <StatusRow rowStyle={styles.dataRow} textStyle={styles.column}>
          {props.statusMessage}
        </StatusRow>
      )}

      {/* Mobile: Grouped view by departure name */}
      {isMobile &&
        !props.hideDepartureCol &&
        Object.entries(getGroupedData()).map(([groupName, items]) => (
          <div key={groupName}>
            {/* Group Header */}
            <div style={styles.groupHeader}>
              {getTranslation(props.language, "departure")}: {groupName}
            </div>
            {items.map(renderMobileRow)}
          </div>
        ))}

      {/* Mobile: Flat view when the departure column is hidden */}
      {isMobile && props.hideDepartureCol && getSortedData().map(renderMobileRow)}

      {/* Desktop: Regular view */}
      {!isMobile &&
        getSortedData().map((data) => {
          const remarkText = processRemarks(data.remarks);

          return (
            <div
              key={data.key}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Row style={styles.dataRow}>
                <Col style={styles.column} span={4}>
                  {data.lineName}
                </Col>
                <Col
                  style={styles.column}
                  span={props.hideDepartureCol ? 16 : 9}
                >
                  {data.direction}
                </Col>
                {!props.hideDepartureCol && (
                  <Col style={styles.column} span={9}>
                    {data.departureName}
                  </Col>
                )}
                <Col
                  style={{ ...styles.column, textAlign: "right" }}
                  span={props.hideDepartureCol ? 4 : 2}
                >
                  {data.when == null
                    ? getTranslation(props.language, "cancelled")
                    : data.when > 0
                      ? `${data.when} ${getTranslation(props.language, "minutes")}`
                      : getTranslation(props.language, "now")}
                </Col>
              </Row>

              {remarkText && props.remarksVisibility && (
                <Marquee
                  speed={30}
                  play={!isPaused}
                  style={styles.marquee}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(remarkText),
                    }}
                    onClick={(e) =>
                      e.target.tagName === "A" && e.stopPropagation()
                    }
                  />
                </Marquee>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default DepartureTable;
