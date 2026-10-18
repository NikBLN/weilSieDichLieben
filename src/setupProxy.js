// Development server only (not part of the build): serves the example header
// notice from docs/notice/, so there is one file to edit while testing.
// Images come from public/ like all other images.
// In production the file lives on the web server, see README "Header notice".
const path = require("path");

const NOTICE_DIR = path.join(__dirname, "..", "docs", "notice");

// A missing file answers 404 instead of logging an error.
const sendOr404 = (res, file) => {
  res.sendFile(file, (error) => {
    if (error && !res.headersSent) res.sendStatus(404);
  });
};

module.exports = (app) => {
  app.get("/notice.json", (req, res) => {
    res.set("Cache-Control", "no-store");
    sendOr404(res, path.join(NOTICE_DIR, "notice.json"));
  });
};
