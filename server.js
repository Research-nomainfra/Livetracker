// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// node-fetch workaround for CommonJS environment on Render
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(__dirname));

/* ----------------------------------------------------------------
   CONFIG
------------------------------------------------------------------*/
const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExMTlhNjU3YzJhNzRlZmE5MjI2N2VjZGM1YTQzNGFjIiwiaCI6Im11cm11cjY0In0=";

// Round coordinates to 6 decimal places (ORS requires this)
const round6 = (num) => Number(parseFloat(num).toFixed(6));

/* ----------------------------------------------------------------
   GET STOCK ROUTES (data/Routes.json)
------------------------------------------------------------------*/
app.get("/routes", (req, res) => {
  try {
    const file = path.join(__dirname, "data", "Routes.json");
    const json = fs.readFileSync(file, "utf8");
    res.json(JSON.parse(json));
  } catch (err) {
    console.error("❌ Failed to load Routes.json", err);
    res.status(500).json({ error: "Failed to load routes file" });
  }
});

/* ----------------------------------------------------------------
   GET ROUTE FROM ORS (lng,lat → required format)
------------------------------------------------------------------*/
app.get("/route", async (req, res) => {
  let { start_lat, start_lng, end_lat, end_lng } = req.query;

  // Validate presence
  if (!start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  // Round to 6 decimals
  start_lat = round6(start_lat);
  start_lng = round6(start_lng);
  end_lat = round6(end_lat);
  end_lng = round6(end_lng);

  // ORS format: start = LON, LAT
  const orsURL =
    `https://api.openrouteservice.org/v2/directions/driving-car?` +
    `api_key=${ORS_API_KEY}` +
    `&start=${start_lng},${start_lat}` +
    `&end=${end_lng},${end_lat}`;

  console.log("\n-----------------------------------------");
  console.log("📡 ORS REQUEST →", orsURL);

  try {
    const response = await fetch(orsURL);

    if (!response.ok) {
      console.error("❌ ORS FAILED:", response.status);
      throw new Error(`ORS HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ ORS success");
    res.json(data);
  } catch (err) {
    console.error("❌ ORS fetch failed:", err);
    res.status(500).json({
      error: "ORS request failed",
      details: err.message,
    });
  }
});

/* ----------------------------------------------------------------
   SERVE MAIN HTML FILE
------------------------------------------------------------------*/
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Livemap.html"));
});

/* ----------------------------------------------------------------
   START SERVER
------------------------------------------------------------------*/
const PORT = process.env.PORT || 10000; // Render uses 10000 inside container
app.listen(PORT, () => {
  console.log("=========================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🌐 Ready on Render!");
  console.log("=========================================\n");
});
