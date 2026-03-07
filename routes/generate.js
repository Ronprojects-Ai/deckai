// routes/generate.js
const express = require("express");
const router = express.Router();
const { generateDeckContent } = require("../services/claude");
const { generatePPTX } = require("../services/pptx");
const { generateDOCX } = require("../services/docx");
const { generatePDF } = require("../services/pdf");
const { sessions } = require("./payment");

// ── Generate deck content (calls Claude with YOUR key) ─────
// Only works if session is marked as paid
router.post("/generate", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = sessions[sessionId];

    // Guard: must have paid (or be in test mode)
    if (!session) {
      return res.status(404).json({ error: "Session not found. Please start over." });
    }

    if (!session.paid && process.env.NODE_ENV !== "development") {
      return res.status(402).json({ error: "Payment required before generating deck." });
    }

    // If already generated, return cached data
    if (session.deckData) {
      return res.json({ success: true, deckData: session.deckData });
    }

    console.log(`Generating deck for: ${session.formData.startupName}`);

    // Call Claude — YOUR key is used here, client never sees it
    const deckData = await generateDeckContent(session.formData);
    session.deckData = deckData;

    res.json({ success: true, deckData });
  } catch (err) {
    console.error("generate error:", err);
    res.status(500).json({ error: "Failed to generate deck content. Please try again." });
  }
});

// ── Download PPTX ──────────────────────────────────────────
router.get("/download/pptx/:sessionId", async (req, res) => {
  try {
    const session = sessions[req.params.sessionId];
    if (!session || !session.paid && process.env.NODE_ENV !== "development") {
      return res.status(402).send("Payment required");
    }
    if (!session.deckData) {
      return res.status(400).send("Generate deck first");
    }

    const buf = await generatePPTX(session.deckData, session.formData, session.theme);
    const filename = session.formData.startupName.replace(/\s+/g, "_") + "_Pitch_Deck.pptx";

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err) {
    console.error("pptx download error:", err);
    res.status(500).send("Failed to generate PPTX");
  }
});

// ── Download DOCX ──────────────────────────────────────────
router.get("/download/docx/:sessionId", async (req, res) => {
  try {
    const session = sessions[req.params.sessionId];
    if (!session || !session.paid && process.env.NODE_ENV !== "development") {
      return res.status(402).send("Payment required");
    }
    if (!session.deckData) {
      return res.status(400).send("Generate deck first");
    }

    const buf = await generateDOCX(session.deckData, session.formData, session.theme);
    const filename = session.formData.startupName.replace(/\s+/g, "_") + "_One_Pager.docx";

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err) {
    console.error("docx download error:", err);
    res.status(500).send("Failed to generate DOCX");
  }
});

// ── Download PDF ───────────────────────────────────────────
router.get("/download/pdf/:sessionId", async (req, res) => {
  try {
    const session = sessions[req.params.sessionId];
    if (!session || !session.paid && process.env.NODE_ENV !== "development") {
      return res.status(402).send("Payment required");
    }
    if (!session.deckData) {
      return res.status(400).send("Generate deck first");
    }

    const buf = await generatePDF(session.deckData, session.formData, session.theme);
    const filename = session.formData.startupName.replace(/\s+/g, "_") + "_Pitch_Deck.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err) {
    console.error("pdf download error:", err);
    res.status(500).send("Failed to generate PDF");
  }
});

// ── Test session (dev only) ────────────────────────────────
router.post("/dev/test-session", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Dev only" });
  }
  const { v4: uuidv4 } = require("uuid");
  const { formData, theme } = req.body;
  const sessionId = uuidv4();
  sessions[sessionId] = { paid: true, formData, theme: theme || "midnight", deckData: null };
  res.json({ sessionId });
});

module.exports = router;
