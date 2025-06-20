import React from "react";
import { Button } from "antd";
import { getTranslation } from "../dictionary";

const CookieBanner = ({ visible, onAccept, onDecline, language }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "16px",
        backgroundColor: "rgba(0,0,0,0.9)",
        color: "orange",
        boxShadow: "0px -2px 5px rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ marginRight: "16px", flex: 1 }}>
        {getTranslation(language, "cookieBannerText")}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          onClick={onAccept}
          style={{
            backgroundColor: "#f0d722",
            borderColor: "#f0d722",
            color: "black",
            boxShadow: "0px 0px 5px 0px rgba(0,0,0,0.5)",
          }}
        >
          {getTranslation(language, "acceptCookies")}
        </Button>
        <Button
          onClick={onDecline}
          ghost
          style={{ color: "#f0d722", borderColor: "#f0d722" }}
        >
          {getTranslation(language, "declineCookies")}
        </Button>
      </div>
    </div>
  );
};

export default CookieBanner;
