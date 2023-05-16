import React from "react";
import { CloseOutlined } from "@ant-design/icons";

const CloseButtonTopRight = (props) => {
  return (
    <div
      onClick={() => {
        props.setSettingsAreVisible(false);
      }}
      style={{
        position: "absolute",
        top: "-10px",
        right: "-10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontWeight: "bold", color: "#f0d722" }}>
        <CloseOutlined />
      </span>
    </div>
  );
};

export default CloseButtonTopRight;
