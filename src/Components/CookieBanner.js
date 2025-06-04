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
        backgroundColor: "#fff",
        boxShadow: "0px -2px 5px rgba(0,0,0,0.3)",
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        {getTranslation(language, "cookieBannerText")}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          onClick={onAccept}
          style={{ marginRight: "8px" }}
        >
          {getTranslation(language, "acceptCookies")}
        </Button>
        <Button onClick={onDecline}>
          {getTranslation(language, "declineCookies")}
        </Button>
      </div>
    </div>
  );
};

export default CookieBanner;
