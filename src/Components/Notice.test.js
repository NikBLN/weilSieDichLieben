import { fireEvent, render, screen } from "@testing-library/react";
import Notice from "./Notice";

const vbbNotice = {
  badge: { de: "NEU", en: "NEW" },
  title: {
    de: "Abfahrtsdaten jetzt direkt vom {image}",
    en: "Departure data now directly from {image}",
  },
  text: { de: "Danke an den VBB!" },
  image: "/VBB.png",
  imageAlt: "VBB",
};

describe("Notice", () => {
  test("shows badge, title, text and image in the chosen language", () => {
    render(<Notice notice={vbbNotice} language="en" onClose={() => {}} />);

    expect(screen.getByText("NEW")).toBeTruthy();
    expect(screen.getByText(/Departure data now directly from/)).toBeTruthy();
    // No english text given, so the german one is used.
    expect(screen.getByText("Danke an den VBB!")).toBeTruthy();
    expect(screen.getByAltText("VBB").getAttribute("src")).toBe(
      "/VBB.png",
    );
  });

  test("puts the image at the placeholder", () => {
    render(
      <Notice
        notice={{ title: "Vor {image} nach", image: "/a.png", imageAlt: "A" }}
        language="de"
        onClose={() => {}}
      />,
    );

    const image = screen.getByAltText("A");
    expect(image.previousSibling.textContent).toBe("Vor ");
    expect(image.nextSibling.textContent).toBe(" nach");
  });

  test("appends the image without placeholder", () => {
    render(
      <Notice
        notice={{ title: "Titel", image: "/a.png", imageAlt: "A" }}
        language="de"
        onClose={() => {}}
      />,
    );

    expect(screen.getByAltText("A").parentElement.textContent).toBe("Titel ");
  });

  test("drops the placeholder when there is no image", () => {
    const { container } = render(
      <Notice
        notice={{ title: "Ohne {image}Bild" }}
        language="de"
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Ohne Bild")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  test("shows no countdown bar for a permanent notice", () => {
    render(<Notice notice={vbbNotice} language="de" onClose={() => {}} />);

    expect(screen.queryByTestId("notice-countdown")).toBeNull();
  });

  test("runs the countdown bar over hideAfter, continuing where it was", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-18T12:00:00Z"));
    const now = Date.now();

    const notice = { ...vbbNotice, hideAfter: 30 };
    const { rerender } = render(
      <Notice
        notice={notice}
        hideAt={now + 20000}
        language="de"
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId("notice-countdown").style.animation).toBe(
      "noticeCountdown 30000ms linear -10000ms forwards",
    );

    // A later re-render keeps the running animation untouched.
    jest.advanceTimersByTime(5000);
    rerender(
      <Notice
        notice={notice}
        hideAt={now + 20000}
        language="de"
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId("notice-countdown").style.animation).toBe(
      "noticeCountdown 30000ms linear -10000ms forwards",
    );
    jest.useRealTimers();
  });

  test("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(<Notice notice={vbbNotice} language="de" onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Schließen" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
