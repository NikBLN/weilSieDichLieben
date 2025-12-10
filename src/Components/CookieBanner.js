import React from "react";
import { Button } from "antd";
import { getTranslation } from "../dictionary";
import useIsMobile from "../hooks/useIsMobile";

const CookieBanner = ({ visible, onAccept, onDecline, language }) => {
  const isMobile = useIsMobile();

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? "12px" : "16px",
        backgroundColor: "rgba(0,0,0,0.9)",
        color: "orange",
        boxShadow: "0px -2px 5px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "center",
        gap: "12px",
        zIndex: 1000,
      }}
    >
      <div style={{ marginRight: isMobile ? 0 : "16px", flex: 1, fontSize: isMobile ? "14px" : "16px" }}>
        {getTranslation(language, "cookieBannerText")}
      </div>
      <div style={{ display: "flex", gap: "8px", flexDirection: isMobile ? "column" : "row" }}>
        <Button
          onClick={onAccept}
          style={{
            backgroundColor: "#f0d722",
            borderColor: "#f0d722",
            color: "black",
            boxShadow: "0px 0px 5px 0px rgba(0,0,0,0.5)",
            width: isMobile ? "100%" : "auto",
          }}
        >
          {getTranslation(language, "acceptCookies")}
        </Button>
        <Button
          onClick={onDecline}
          ghost
          style={{ color: "#f0d722", borderColor: "#f0d722", width: isMobile ? "100%" : "auto" }}
        >
          {getTranslation(language, "declineCookies")}
        </Button>
      </div>
    </div>
  );
};

export default CookieBanner;
