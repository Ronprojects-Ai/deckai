// server.js — DeckAI main server
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { router: paymentRouter } = require("./routes/payment");
const generateRouter = require("./routes/generate");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── API Routes ─────────────────────────────────────────────
app.use("/api/payment", paymentRouter);
app.use("/api", generateRouter);

// ── Health check ───────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "production",
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    razorpay: !!process.env.RAZORPAY_KEY_ID,
  });
});

// ── Serve frontend for all other routes ───────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   DeckAI Server running on :${PORT}    ║
  ║   http://localhost:${PORT}              ║
  ║                                      ║
  ║   Anthropic key: ${process.env.ANTHROPIC_API_KEY ? "✓ loaded" : "✗ MISSING"}           ║
  ║   Razorpay key:  ${process.env.RAZORPAY_KEY_ID ? "✓ loaded" : "✗ MISSING"}           ║
  ╚══════════════════════════════════════╝
  `);
});
