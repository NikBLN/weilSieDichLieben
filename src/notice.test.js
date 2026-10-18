import {
  fetchNotice,
  getActiveNotice,
  localize,
  stripJsonComments,
} from "./notice";

const at = (...args) => new Date(...args).getTime();

describe("localize", () => {
  test("uses one string for all languages", () => {
    expect(localize("Hallo", "en")).toBe("Hallo");
  });

  test("picks the language and falls back to German", () => {
    expect(localize({ de: "Hallo", en: "Hello" }, "en")).toBe("Hello");
    expect(localize({ de: "Hallo" }, "en")).toBe("Hallo");
  });

  test("returns null for missing or invalid values", () => {
    expect(localize(undefined, "de")).toBeNull();
    expect(localize({ en: 1 }, "en")).toBeNull();
  });
});

describe("getActiveNotice", () => {
  const notice = { version: 1, title: "Hinweis" };

  test("shows a notice without time window", () => {
    expect(getActiveNotice(notice)).toBe(notice);
  });

  test("hides inactive, empty or malformed notices", () => {
    expect(getActiveNotice(null)).toBeNull();
    expect(getActiveNotice({ ...notice, active: false })).toBeNull();
    expect(getActiveNotice({ version: 1, text: "Ohne Titel" })).toBeNull();
    expect(getActiveNotice({ title: "Ohne Version" })).toBeNull();
    expect(getActiveNotice({ ...notice, version: "1" })).toBeNull();
    expect(getActiveNotice({ ...notice, from: "irgendwann" })).toBeNull();
  });

  test("accepts only a positive number of seconds for hideAfter", () => {
    const temporary = { ...notice, hideAfter: 30 };

    expect(getActiveNotice(temporary)).toBe(temporary);
    expect(getActiveNotice({ ...notice, hideAfter: "30" })).toBeNull();
    expect(getActiveNotice({ ...notice, hideAfter: 0 })).toBeNull();
  });

  test("treats date-only bounds as whole local days", () => {
    const windowed = { ...notice, from: "2026-10-18", until: "2026-10-20" };

    expect(getActiveNotice(windowed, at(2026, 9, 17, 23, 59))).toBeNull();
    expect(getActiveNotice(windowed, at(2026, 9, 18, 0, 0))).toBe(windowed);
    expect(getActiveNotice(windowed, at(2026, 9, 20, 23, 59))).toBe(windowed);
    expect(getActiveNotice(windowed, at(2026, 9, 21, 0, 0))).toBeNull();
  });

  test("respects exact times", () => {
    const windowed = { ...notice, until: "2026-10-18T12:00:00+02:00" };

    expect(
      getActiveNotice(windowed, Date.parse("2026-10-18T11:59:00+02:00")),
    ).toBe(windowed);
    expect(
      getActiveNotice(windowed, Date.parse("2026-10-18T12:01:00+02:00")),
    ).toBeNull();
  });
});

describe("stripJsonComments", () => {
  test("removes line and block comments but keeps strings", () => {
    const text = `{
      // a line comment
      "image": "https://example.com/a.png", // after a value
      /* a block
         comment */
      "title": "Text with // and /* inside \\" quote"
    }`;

    expect(JSON.parse(stripJsonComments(text))).toEqual({
      image: "https://example.com/a.png",
      title: 'Text with // and /* inside " quote',
    });
  });
});

describe("fetchNotice", () => {
  afterEach(() => {
    delete global.fetch;
  });

  test("loads the notice without cache", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('{\n  // comment\n  "title": "Hinweis"\n}'),
      }),
    );

    await expect(fetchNotice()).resolves.toEqual({ title: "Hinweis" });
    expect(global.fetch.mock.calls[0][0]).toMatch(/^\/notice\.json\?t=\d+$/);
  });

  test("returns null when the file is missing or not JSON", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
    await expect(fetchNotice()).resolves.toBeNull();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("<!doctype html><html></html>"),
      }),
    );
    await expect(fetchNotice()).resolves.toBeNull();
  });
});
