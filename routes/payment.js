// routes/payment.js
const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

// In-memory session store (use Redis in production)
// Stores: { sessionId: { paid: bool, formData, deckData, theme } }
const sessions = {};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Step 1: Create Razorpay order ──────────────────────────
// Client sends form data → we create a Razorpay order → return order_id to client
router.post("/create-order", async (req, res) => {
  try {
    const { formData, theme } = req.body;

    // Basic validation
    const required = ["startupName", "industry", "tagline", "problem", "solution", "marketSize", "team"];
    for (const field of required) {
      if (!formData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Create a session ID to link payment → generation
    const sessionId = uuidv4();
    sessions[sessionId] = { paid: false, formData, theme: theme || "midnight", deckData: null };

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: parseInt(process.env.PRICE_PAISE) || 99900, // ₹999
      currency: "INR",
      receipt: sessionId,
      notes: { startupName: formData.startupName, sessionId },
    });

    res.json({
      orderId: order.id,
      sessionId,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Safe to send — this is the public key
    });
  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── Step 2: Verify payment signature ──────────────────────
// After Razorpay checkout succeeds, client sends payment details for verification
router.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId } = req.body;

    // Verify signature using your secret key (server-side only)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Mark session as paid
    if (sessions[sessionId]) {
      sessions[sessionId].paid = true;
      sessions[sessionId].paymentId = razorpay_payment_id;
    }

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error("verify-payment error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// Export sessions so other routes can check payment status
module.exports = { router, sessions };
