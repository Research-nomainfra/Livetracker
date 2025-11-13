
// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// node-fetch workaround for CommonJS
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExMTlhNjU3YzJhNzRlZmE5MjI2N2VjZGM1YTQzNGFjIiwiaCI6Im11cm11cjY0In0=";

// ✅ New endpoint: serve dynamic rail route data
app.get("/Routes", (req, res) => {
  const routesPath = path.join(__dirname, "data", "Routes.json");
  try {
    const data = fs.readFileSync(routesPath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("Failed to load routes:", err);
    res.status(500).json({ error: "Unable to load Routes.json" });
  }
});

// ✅ Proxy endpoint for OpenRouteService
app.get("/Route", async (req, res) => {
  const { start_lat, start_lng, end_lat, end_lng } = req.query;
  if (!start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start_lng},${start_lat}&end=${end_lng},${end_lat}`;
  console.log("→ ORS:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ORS HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("ORS fetch failed:", err);
    res.status(500).json({ error: "ORS request failed", details: err.message });
  }
});

// ✅ Serve your main app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Livemap.html"));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running → http://localhost:${PORT}`));
