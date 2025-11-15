// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ✅ Production ORS Key
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExMTlhNjU3YzJhNzRlZmE5MjI2N2VjZGM1YTQzNGFjIiwiaCI6Im11cm11cjY0In0=";

/* ------------------------------------------------------------------
   ROUTES API  (lowercase, consistent)
------------------------------------------------------------------ */
app.get("/routes", (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "Routes.json");
    const data = fs.readFileSync(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Failed to load Routes.json:", error);
    res.status(500).json({ error: "Failed to load routes file" });
  }
});

/* ------------------------------------------------------------------
   ORS PROXY API (coordinates swapped correctly)
------------------------------------------------------------------ */
app.get("/route", async (req, res) => {
  const { start_lat, start_lng, end_lat, end_lng } = req.query;

  if (!start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  // ORS requires: start = LON, LAT
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start_lng},${start_lat}&end=${end_lng},${end_lat}`;
  console.log("→ ORS:", url);

  try {
    const ors = await fetch(url);
    if (!ors.ok) throw new Error("ORS HTTP " + ors.status);
    const data = await ors.json();
    res.json(data);
  } catch (error) {
    console.error("ORS fetch failed:", error);
    res.status(500).json({ error: "ORS request failed", details: error.message });
  }
});

/* ------------------------------------------------------------------
   SERVE MAIN HTML
------------------------------------------------------------------ */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Livemap.html"));
});

/* ------------------------------------------------------------------
   START SERVER
------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
