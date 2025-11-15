// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExMTlhNjU3YzJhNzRlZmE5MjI2N2VjZGM1YTQzNGFjIiwiaCI6Im11cm11cjY0In0=";

// Round for ORS compatibility
const round6 = (n) => Number(parseFloat(n).toFixed(6));

/* =====================================================================
   1. SECURE ORS GEOCODING (frontend never sees your ORS key)
===================================================================== */
app.get("/geocode", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing ?query=" });
  }

  const url =
    `https://api.openrouteservice.org/geocode/search?` +
    `api_key=${ORS_API_KEY}` +
    `&text=${encodeURIComponent(query)}` +
    `&size=1&boundary.country=IND`;

  console.log("📡 ORS GEOCODE:", url);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`ORS Geocode HTTP ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("❌ ORS Geocode failed:", err.message);
    res.status(500).json({ error: "Geocode failed", details: err.message });
  }
});

/* =====================================================================
   2. LOAD STOCK POINT ROUTES
===================================================================== */
app.get("/routes", (req, res) => {
  try {
    const file = path.join(__dirname, "data", "Routes.json");
    res.json(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (err) {
    res.status(500).json({ error: "Failed to load Routes.json" });
  }
});

/* =====================================================================
   3. ORS DIRECTIONS ROUTING
===================================================================== */
app.get("/route", async (req, res) => {
  let { start_lat, start_lng, end_lat, end_lng } = req.query;

  if (!start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  // Round for ORS safety
  start_lat = round6(start_lat);
  start_lng = round6(start_lng);
  end_lat = round6(end_lat);
  end_lng = round6(end_lng);

  const url =
    `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}` +
    `&start=${start_lng},${start_lat}` + // ORS = lon,lat
    `&end=${end_lng},${end_lat}`;

  console.log("📡 ORS ROUTE:", url);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`ORS Route HTTP ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("❌ ORS Route error:", err.message);
    res.status(500).json({ error: "Routing failed", details: err.message });
  }
});

/* =====================================================================
   4. SERVE MAIN HTML
===================================================================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Livemap.html"));
});

/* =====================================================================
   5. START SERVER
===================================================================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on Render (port ${PORT})`);
});
