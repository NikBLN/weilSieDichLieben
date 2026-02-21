import { Row, Col, Popover, Modal } from "antd";
import React, { useState } from "react";
import Marquee from "react-fast-marquee";
import { getTranslation } from "../dictionary";
import radarIcon from "../images/radar.png";
import RadarMap from "./RadarMap";
import useIsMobile from "../hooks/useIsMobile";

const DepartureTable = (props) => {
  const [isPaused, setIsPaused] = useState(false);
  const [sortOrder, setSortOrder] = useState("off");
  const [sortField, setSortField] = useState("departureName");
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [selectedStopLocation, setSelectedStopLocation] = useState(null);
  const isMobile = useIsMobile();
  const FONTSIZE = props.fontSize;
  const FONTFAMILYNAME = "DotMatrix";

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
      }
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
      return props.dataSource.sort((a, b) => a.when - b.when);

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
          <Col style={styles.columnNameClickable} span={props.hideDepartureCol ? 18 : 9} onClick={() => handleSort("direction")}>
            {getTranslation(props.language, "destination")}{" "}
            {sortField === "direction" && sortOrder !== "off" && (sortOrder === "asc" ? "↑" : "↓")}
          </Col>
          {!props.hideDepartureCol && (
            <Col style={styles.columnNameClickable} span={9} onClick={() => handleSort("departureName")}>
              {getTranslation(props.language, "departureName")}{" "}
              {sortField === "departureName" && sortOrder !== "off" && (sortOrder === "asc" ? "↑" : "↓")}
            </Col>
          )}
          <Col style={styles.columnName} span={2}>
            {getTranslation(props.language, "when")}
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
            {getTranslation(props.language, "destination")}
          </Col>
          <Col style={{ ...styles.columnName, textAlign: "right" }} span={8}>
            {getTranslation(props.language, "when")}
          </Col>
        </Row>
      )}

      {/* Mobile: Grouped view */}
      {isMobile && Object.entries(getGroupedData()).map(([groupName, items]) => (
        <div key={groupName}>
          {/* Group Header */}
          <div
            style={styles.groupHeader}
            onClick={() => {
              const firstItemWithTrip = items.find(item => item.tripId);
              if (firstItemWithTrip) {
                setSelectedStopLocation(firstItemWithTrip.stopLocation);
                setRadarModalOpen(true);
              }
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span>{getTranslation(props.language, "departure")}: {groupName}</span>
              {items.some(item => item.tripId) && (
                <img
                  src={radarIcon}
                  alt="radar"
                  style={{ width: mobileFontSize * 0.8, height: mobileFontSize * 0.8 }}
                />
              )}
            </span>
          </div>
          {/* Group Items */}
          {items.map((data) => {
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
          })}
        </div>
      ))}

      {/* Desktop: Regular view */}
      {!isMobile && getSortedData().map((data) => {
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
              <Col style={styles.column} span={props.hideDepartureCol ? 18 : 9}>
                {data.direction}
              </Col>
              {!props.hideDepartureCol && (
                <Col style={styles.column} span={9}>
                  {data.tripId ? (
                  <Popover
                    content={
                      <RadarMap
                        stopLocation={data.stopLocation}
                        dataSource={props.dataSource}
                        language={props.language}
                      />
                    }
                    trigger="click"
                    placement="right"
                    overlayStyle={{ width: 520, backgroundColor: "lightGray", borderRadius: "8px" }}
                  >
                    <span
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {data.departureName}
                        <img
                        src={radarIcon}
                        alt="radar"
                        style={{
                          width: FONTSIZE,
                          height: FONTSIZE,
                        }}
                      />
                    </span>
                  </Popover>
                ) : (
                  data.departureName
                )}
              </Col>
              )}
              <Col style={styles.column} span={2}>
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
                  onClick={(e) =>
                    e.target.tagName === "A" && e.stopPropagation()
                  }
                />
              </Marquee>
            )}
          </div>
        );
      })}

      {/* Mobile Radar Modal */}
      {isMobile && (
        <Modal
          open={radarModalOpen}
          onCancel={() => setRadarModalOpen(false)}
          footer={null}
          width="100%"
          centered
          styles={{
            body: { padding: 0 },
            content: { padding: 0 }
          }}
          className="mobile-fullscreen-modal"
        >
          <RadarMap
            stopLocation={selectedStopLocation}
            dataSource={props.dataSource}
            language={props.language}
            isMobile={true}
          />
        </Modal>
      )}
    </div>
  );
};

export default DepartureTable;
