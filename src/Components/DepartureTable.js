import { Row, Col } from "antd";
import React from "react";

const DepartureTable = (props) => {
  const sortedDataSource = props.dataSource.sort((a, b) => {
    return a.when - b.when;
  });

  return (
    <div style={{ padding: "16px", borderRadius: "8px" }}>
      <Row style={{ backgroundColor: "lightGray", padding: "8px" }}>
        <Col style={{ fontSize: "24px" }} span={2}>
          Linie
        </Col>
        <Col style={{ fontSize: "24px" }} span={9}>
          Ziel
        </Col>
        <Col style={{ fontSize: "24px" }} span={9}>
          Abfahrt von
        </Col>
        <Col style={{ fontSize: "24px" }} span={4}>
          Abfahrt in
        </Col>
      </Row>
      {sortedDataSource.map((data) => {
        return (
          <Row
            key={data.key}
            style={{ backgroundColor: "black", padding: "8px" }}
          >
            <Col style={{ color: "orange", fontSize: "24px" }} span={2}>
              {data.lineName}
            </Col>
            <Col style={{ color: "orange", fontSize: "24px" }} span={9}>
              {data.direction}
            </Col>
            <Col style={{ color: "orange", fontSize: "24px" }} span={9}>
              {data.departureName}
            </Col>
            <Col style={{ color: "orange", fontSize: "24px" }} span={4}>
              {data.when > 0 ? `${data.when} min` : "Jetzt"}
            </Col>
          </Row>
        );
      })}
    </div>
  );
};

export default DepartureTable;
