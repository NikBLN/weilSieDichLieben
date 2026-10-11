import React, { useLayoutEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";

// Centered when the message fits the row, scrolled like a remark when not.
const StatusRow = ({ children, rowStyle, textStyle }) => {
  const rowRef = useRef(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      // Not a ref: the marquee re-mounts its children, detaching the first.
      const text = row.querySelector("[data-status-text]");
      if (text) setOverflows(text.scrollWidth > row.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [children]);

  const text = (
    <span
      data-status-text
      style={{ ...textStyle, whiteSpace: "nowrap", display: "inline-block" }}
    >
      {children}
    </span>
  );

  return (
    <div ref={rowRef} style={{ ...rowStyle, textAlign: "center" }} role="status">
      {overflows ? (
        <Marquee speed={30} style={{ ...textStyle, backgroundColor: "black" }}>
          {text}
          <span style={{ display: "inline-block", width: "4em" }} />
        </Marquee>
      ) : (
        text
      )}
    </div>
  );
};

export default StatusRow;
