import { Row, Col } from "antd";
import React from "react";
import Marquee from "react-fast-marquee";

const DepartureTable = (props) => {
  const FONTSIZE = props.fontSize + "px";
  const FONTFAMILYNAME = "DotMatrix";

  const sortedDataSource = props.dataSource.sort((a, b) => {
    return a.when - b.when;
  });

  return (
    <div style={{ padding: "16px", borderRadius: "8px" }}>
      <Row
        style={{
          backgroundColor: "lightGray",
          padding: "8px",
          position: "sticky",
          top: "-8px",
          zIndex: 5,
        }}
      >
        <Col
          style={{ fontSize: FONTSIZE, fontFamily: FONTFAMILYNAME }}
          span={4}
        >
          Linie
        </Col>
        <Col
          style={{ fontSize: FONTSIZE, fontFamily: FONTFAMILYNAME }}
          span={9}
        >
          Ziel
        </Col>
        <Col
          style={{ fontSize: FONTSIZE, fontFamily: FONTFAMILYNAME }}
          span={9}
        >
          Abfahrt von
        </Col>
        <Col
          style={{ fontSize: FONTSIZE, fontFamily: FONTFAMILYNAME }}
          span={2}
        >
          Abfahrt in
        </Col>
      </Row>
      {sortedDataSource.map((data) => {
        // summarize remarks into one string for display
        let remarkText = "";
        if (data.remarks && data.remarks.length > 0) {
          if (data.remarks.length > 1) {
            data.remarks.forEach((remark, index) => {
              if (index === data.remarks.length - 1) {
                remarkText += remark.text;
              } else {
                remarkText += `${remark.text} *** `;
              }
            });
          } else {
            remarkText = data.remarks[0].text;
          }
        }

        // return the row of the departure, and return the remark text if there is any
        return (
          <div
            key={data.key}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <Row style={{ backgroundColor: "black", padding: "8px" }}>
              <Col
                style={{
                  color: "orange",
                  fontSize: FONTSIZE,
                  fontFamily: FONTFAMILYNAME,
                }}
                span={4}
              >
                {data.lineName}
              </Col>
              <Col
                style={{
                  color: "orange",
                  fontSize: FONTSIZE,
                  fontFamily: FONTFAMILYNAME,
                }}
                span={9}
              >
                {data.direction}
              </Col>
              <Col
                style={{
                  color: "orange",
                  fontSize: FONTSIZE,
                  fontFamily: FONTFAMILYNAME,
                }}
                span={9}
              >
                {data.departureName}
              </Col>
              <Col
                style={{
                  color: "orange",
                  fontSize: FONTSIZE,
                  fontFamily: FONTFAMILYNAME,
                }}
                span={2}
              >
                {data.when > 0 ? `${data.when} min` : "Jetzt"}
              </Col>
            </Row>
            {remarkText !== "" && (
              <Marquee
                style={{
                  color: "orange",
                  fontSize: FONTSIZE,
                  fontFamily: FONTFAMILYNAME,
                }}
              >
                {remarkText}
              </Marquee>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DepartureTable;
