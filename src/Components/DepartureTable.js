import { Row, Col } from "antd";
import React, { useState } from "react";
import Marquee from "react-fast-marquee";
import { getTranslation } from "../dictionary";

const DepartureTable = (props) => {
  const [isPaused, setIsPaused] = useState(false);
  const [sortOrder, setSortOrder] = useState("off");
  const FONTSIZE = props.fontSize;
  const FONTFAMILYNAME = "DotMatrix";

  const styles = {
    columnName: {
      fontSize: FONTSIZE,
      fontFamily: FONTFAMILYNAME,
    },
    column: {
      color: "orange",
      fontSize: FONTSIZE,
      fontFamily: FONTFAMILYNAME,
    },
    headerRow: {
      backgroundColor: "lightGray",
      padding: "8px",
      position: "sticky",
      top: "-8px",
      zIndex: 5,
    },
    dataRow: {
      backgroundColor: "black",
      padding: "8px",
    },
    marquee: {
      color: "orange",
      fontSize: FONTSIZE * 0.8,
      fontFamily: FONTFAMILYNAME,
      backgroundColor: "black",
    },
    columnNameClickable: {
      fontSize: FONTSIZE,
      fontFamily: FONTFAMILYNAME,
      cursor: "pointer",
      userSelect: "none",
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

  const handleSort = () => {
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
  };

  const getSortedData = () => {
    if (sortOrder === "off")
      return props.dataSource.sort((a, b) => a.when - b.when);

    return [...props.dataSource].sort((a, b) => {
      const comparison = a.departureName.localeCompare(b.departureName);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  return (
    <div style={{ padding: "16px", borderRadius: "8px" }}>
      <style>
        {`
          .remark-link, .remark-link:visited, .remark-link:hover, .remark-link:active {
            color: #FFA500 !important;
            text-decoration: underline !important;
            cursor: pointer;
          }
        `}
      </style>

      <Row style={styles.headerRow}>
        <Col style={styles.columnName} span={4}>
          {getTranslation(props.language, "line")}
        </Col>
        <Col style={styles.columnName} span={9}>
          {getTranslation(props.language, "destination")}
        </Col>
        <Col style={styles.columnNameClickable} span={9} onClick={handleSort}>
          {getTranslation(props.language, "departureName")}{" "}
          {sortOrder !== "off" && (sortOrder === "asc" ? "↑" : "↓")}
        </Col>
        <Col style={styles.columnName} span={2}>
          {getTranslation(props.language, "when")}
        </Col>
      </Row>

      {getSortedData().map((data) => {
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
              <Col style={styles.column} span={9}>
                {data.direction}
              </Col>
              <Col style={styles.column} span={9}>
                {data.departureName}
              </Col>
              <Col style={styles.column} span={2}>
                {data.when == null
                  ? "Fällt aus"
                  : data.when > 0
                  ? `${data.when} min`
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
    </div>
  );
};

export default DepartureTable;
