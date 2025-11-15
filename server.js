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

// ORS key
const ORS_API_KEY = "YOUR_ORS_KEY_HERE";

// Round for ORS compatibility
const round6 = (n) => Number(parseFloat(n).toFixed(6));

/* ----------------------------------------------------------
   LOAD STOCK POINT ROUTES (Haldia → Stock Points)
---------------------------------------------------------- */
app.get("/routes", (req, res) => {
  try {
    const file = path.join(__dirname, "data", "Routes.json");
    const json = fs.readFileSync(file, "utf8");
    res.json(JSON.parse(json));
  } catch (err) {
    console.error("❌ Failed to load Routes.json", err);
    res.status(500).json({ error: "Unable to load file" });
  }
});

/* ----------------------------------------------------------
   ORS ROUTING (Directions API)
---------------------------------------------------------- */
app.get("/route", async (req, res) => {
  let { start_lat, start_lng, end_lat, end_lng } = req.query;

  if (!start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  start_lat = round6(start_lat);
  start_lng = round6(start_lng);
  end_lat = round6(end_lat);
  end_lng = round6(end_lng);

  const orsURL = `https://api.openrouteservice.org/v2/directions/driving-car?` +
    `api_key=${ORS_API_KEY}` +
    `&start=${start_lng},${start_lat}` +  // lon, lat
    `&end=${end_lng},${end_lat}`;

  console.log("📡 ORS:", orsURL);

  try {
    const r = await fetch(orsURL);
    if (!r.ok) throw new Error(`ORS HTTP ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("❌ ORS fetch failed:", err.message);
    res.status(500).json({ error: "ORS failure", details: err.message });
  }
});

/* ----------------------------------------------------------
   MAIN HTML FILE
---------------------------------------------------------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Livemap.html"));
});

/* ----------------------------------------------------------
   START SERVER
---------------------------------------------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("===========================================");
  console.log(`🚀 Server running on Render at port ${PORT}`);
  console.log("===========================================\n");
});
