import { useMemo } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { getTranslation } from "../dictionary";
import { localize } from "../notice";

const YELLOW = "#f0d722";
const IMAGE_PLACEHOLDER = "{image}";

// Header notice from /notice.json (see src/notice.js). With `hideAt` a bar at
// the bottom shrinks until the notice hides itself.
const Notice = ({ notice, hideAt, language, onClose, isMobile }) => {
  const badge = localize(notice.badge, language);
  const title = localize(notice.title, language);
  const text = localize(notice.text, language);
  const countdownDuration = notice.hideAfter * 1000;
  // Computed once per countdown: a later re-render must not change the delay,
  // or the browser would move the running bar forward.
  const countdownElapsed = useMemo(
    () =>
      Math.min(
        countdownDuration,
        Math.max(0, countdownDuration - (hideAt - Date.now())),
      ),
    [hideAt, countdownDuration],
  );

  const renderImage = (key) => (
    <img
      key={key}
      src={notice.image}
      alt={localize(notice.imageAlt, language) ?? ""}
      style={{
        height: isMobile ? "20px" : "24px",
        verticalAlign: "middle",
        margin: "0 4px",
      }}
    />
  );

  // Starts part way through when the notice is mounted again, e.g. after
  // moving between header row and own row.
  const renderCountdown = () => (
    <div
      data-testid="notice-countdown"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "3px",
        backgroundColor: YELLOW,
        transformOrigin: "left",
        animation: `noticeCountdown ${countdownDuration}ms linear -${countdownElapsed}ms forwards`,
      }}
    />
  );

  // "{image}" in the title places the image, otherwise it follows the title.
  const renderTitle = () => {
    const parts = title.split(IMAGE_PLACEHOLDER);
    if (!notice.image) return parts.join("");
    if (parts.length === 1) return [title, " ", renderImage("image")];
    return parts.flatMap((part, index) =>
      index === 0 ? [part] : [renderImage(`image-${index}`), part],
    );
  };

  return (
    <div
      data-testid="notice"
      style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? "8px" : "16px",
        minWidth: 0,
        fontFamily: "DotMatrix",
        color: YELLOW,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          border: `2px solid ${YELLOW}`,
          borderRadius: "8px",
          padding: isMobile ? "6px 8px" : "8px 12px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: isMobile ? "14px" : "18px",
          }}
        >
          {badge && (
            <span
              style={{
                backgroundColor: YELLOW,
                color: "black",
                borderRadius: "3px",
                // DotMatrix sits a bit high and left in its box; the uneven
                // padding centers the letters visually.
                padding: "3.5px 4px 2.5px 6px",
                fontSize: isMobile ? "12px" : "14px",
                lineHeight: 1,
              }}
            >
              {badge}
            </span>
          )}
          <span>{renderTitle()}</span>
        </div>
        {text && (
          <div
            style={{ fontSize: isMobile ? "11px" : "13px", marginTop: "4px" }}
          >
            {text}
          </div>
        )}
        {hideAt != null && notice.hideAfter != null && renderCountdown()}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={getTranslation(language, "close")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: YELLOW,
          display: "flex",
          alignItems: "center",
        }}
      >
        <CloseOutlined style={{ fontSize: isMobile ? "18px" : "22px" }} />
      </button>
    </div>
  );
};

export default Notice;
