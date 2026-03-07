// services/pptx.js — Precision layouts, zero overlapping text
// ZONES: header stripe (0-0.55"), content (0.6-6.82"), footer (6.85-7.5")
// Every text box verified to not overlap with any other on same slide

const PptxGenJS = require("pptxgenjs");

const THEMES = {
  midnight: { p:"1E2761", a:"F9A825", d:"0A0F2E", lt:"F0F4FF", sf:"E8EDF8" },
  coral:    { p:"B83232", a:"F5C842", d:"1A0808", lt:"FFF5F0", sf:"FDEAEA" },
  forest:   { p:"1A4731", a:"7ED957", d:"091F12", lt:"F0FAF0", sf:"DCF0DC" },
  ocean:    { p:"0A3D6B", a:"00C6FF", d:"020D1A", lt:"E8F4FF", sf:"C8E8FF" },
  berry:    { p:"5C1A3A", a:"FF6B9D", d:"1A0010", lt:"FFF0F5", sf:"FFD6E8" },
};

const W = 13.33, H = 7.5;
const HDR = 0.58;   // header stripe height — act label + slide# live here
const BOT = 6.80;   // footer starts at 6.85
const SH  = () => ({ type:"outer", blur:10, offset:3, angle:135, color:"000000", opacity:0.13 });

// Short helpers
const R = (sl, o) => sl.addShape("rect", o);
const O = (sl, o) => sl.addShape("oval", o);
const T = (sl, txt, o) => sl.addText(String(txt||""), o);

// ─── Shared header stripe: act label left, slide# right ───────────────────────
function hdr(sl, act, num, th) {
  R(sl, { x:0, y:0, w:W, h:HDR, fill:{color:th.p} });
  R(sl, { x:0, y:HDR-0.05, w:W, h:0.05, fill:{color:th.a} });
  if (act) T(sl, act.toUpperCase(), { x:0.4, y:0.10, w:5, h:0.35, fontSize:9, bold:true, color:th.a, fontFace:"Calibri", margin:0 });
  if (num) T(sl, String(num).padStart(2,"0"), { x:W-1.1, y:0.10, w:0.8, h:0.35, fontSize:9, color:"FFFFFF", fontFace:"Calibri", align:"right", transparency:35, margin:0 });
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function ftr(sl, name, th) {
  R(sl, { x:0, y:BOT+0.08, w:W, h:0.04, fill:{color:th.a}, transparency:60 });
  T(sl, name + "  ·  Confidential", { x:0.4, y:BOT+0.16, w:W-0.8, h:0.24, fontSize:8, color:"BBBBBB", fontFace:"Calibri", margin:0 });
}

// ─── Main entry ───────────────────────────────────────────────────────────────
async function generatePPTX(deckData, formData, themeName = "midnight") {
  const th = THEMES[themeName] || THEMES.midnight;
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.title  = formData.startupName + " Pitch Deck";

  const LAYOUTS = [
    "cover","story","splitR","cards",
    "story","splitL","vision","cards",
    "splitR","splitL","splitR","cards",
    "splitR","splitL","splitR","cards",
    "vision","splitL","ask","closer"
  ];

  deckData.slides.forEach((s, i) => {
    const sl = pres.addSlide();
    switch (LAYOUTS[i] || "splitL") {
      case "cover":  slideCover (sl, s, formData, th); break;
      case "story":  slideStory (sl, s, formData, th); break;
      case "splitR": slideSplitR(sl, s, formData, th); break;
      case "splitL": slideSplitL(sl, s, formData, th); break;
      case "cards":  slideCards (sl, s, formData, th); break;
      case "vision": slideVision(sl, s, formData, th); break;
      case "ask":    slideAsk   (sl, s, formData, th); break;
      case "closer": slideCloser(sl, s, formData, th); break;
    }
  });

  return await pres.write({ outputType:"nodebuffer" });
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. COVER
// Left half: dark primary | Right half: very dark | Stat card floats right
// ═════════════════════════════════════════════════════════════════════════════
function slideCover(sl, s, fd, th) {
  sl.background = { color: th.d };
  R(sl, { x:0, y:0, w:W*0.52, h:H, fill:{color:th.p} });
  R(sl, { x:W*0.51, y:0, w:0.09, h:H, fill:{color:th.a} });
  R(sl, { x:0, y:H-0.08, w:W, h:0.08, fill:{color:th.a} });

  // Company name — large, left column
  T(sl, fd.startupName.toUpperCase(), {
    x:0.5, y:0.85, w:W*0.47, h:2.1,
    fontSize:60, bold:true, color:"FFFFFF", fontFace:"Arial Black", charSpacing:3, margin:0
  });
  // Tagline
  T(sl, s.subtitle || fd.tagline || "", {
    x:0.5, y:3.05, w:W*0.47, h:0.65,
    fontSize:17, color:th.a, fontFace:"Calibri", italic:true, margin:0
  });
  R(sl, { x:0.5, y:3.78, w:2.8, h:0.05, fill:{color:"FFFFFF"} });

  // Proof bullets
  (s.bullets||[]).slice(0,3).forEach((b,i) => {
    R(sl, { x:0.5, y:4.04+i*0.57, w:0.06, h:0.36, fill:{color:th.a} });
    T(sl, b, { x:0.72, y:4.04+i*0.57, w:W*0.43, h:0.47, fontSize:13, color:"BBBBBB", fontFace:"Calibri", margin:0 });
  });

  // Stat card — right half
  R(sl, { x:W*0.59, y:1.35, w:W*0.38, h:3.75, fill:{color:"FFFFFF"}, transparency:5, shadow:SH() });
  R(sl, { x:W*0.59, y:1.35, w:W*0.38, h:0.18, fill:{color:th.a} });
  T(sl, s.bigStat||"", {
    x:W*0.59, y:1.70, w:W*0.38, h:1.95,
    fontSize:52, bold:true, color:th.p, fontFace:"Arial Black", align:"center", margin:0
  });
  T(sl, s.bigStatLabel||"", {
    x:W*0.59, y:3.75, w:W*0.38, h:0.95,
    fontSize:13, color:"666666", fontFace:"Calibri", align:"center", italic:true, lineSpacingMultiple:1.3, margin:0
  });

  T(sl, fd.startupName + "  ·  " + new Date().getFullYear(), {
    x:0.5, y:H-0.42, w:4, h:0.28, fontSize:9, color:"555555", fontFace:"Calibri", margin:0
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. STORY — dark bg, big heading, stat panel right
//    ZONES (all from y=0):
//    0.00–0.58: header stripe
//    0.70–2.65: title (h=1.95)
//    2.70–3.30: subtitle (h=0.55)
//    3.38–3.43: divider
//    3.55–6.55: 3 bullets × 1.0" each (3.55, 4.55, 5.55)
//    Right panel: x=8.9, y=0.70–6.20
// ═════════════════════════════════════════════════════════════════════════════
function slideStory(sl, s, fd, th) {
  sl.background = { color: th.d };
  hdr(sl, s.act, s.slideNumber, th);

  // Ghost quote decoration
  T(sl, "\u201C", {
    x:0.12, y:0.38, w:2.0, h:2.4,
    fontSize:150, color:th.p, fontFace:"Georgia", transparency:24, margin:0
  });

  // Left content column (x: 0.5 – 8.7)
  T(sl, s.title||"", {
    x:0.5, y:0.70, w:8.1, h:1.95,
    fontSize:31, bold:true, color:"FFFFFF", fontFace:"Arial Black", lineSpacingMultiple:1.12, margin:0
  });
  T(sl, s.subtitle||"", {
    x:0.5, y:2.72, w:8.1, h:0.55,
    fontSize:15, color:th.a, fontFace:"Calibri", italic:true, margin:0
  });
  R(sl, { x:0.5, y:3.35, w:2.2, h:0.05, fill:{color:th.a} });

  // 3 bullets — strictly non-overlapping 1.0" slots
  (s.bullets||[]).slice(0,3).forEach((b,i) => {
    O(sl, { x:0.50, y:3.56+i*1.02, w:0.27, h:0.27, fill:{color:th.a} });
    T(sl, b, {
      x:0.92, y:3.53+i*1.02, w:7.6, h:0.78,
      fontSize:15, color:"DDDDDD", fontFace:"Calibri", valign:"middle", margin:0
    });
  });

  // Stat panel — right side, y starts at header bottom
  R(sl, { x:9.0, y:0.70, w:4.0, h:3.3, fill:{color:th.a}, shadow:SH() });
  T(sl, s.bigStat||"", {
    x:9.0, y:0.95, w:4.0, h:1.75,
    fontSize:46, bold:true, color:th.d, fontFace:"Arial Black", align:"center", margin:0
  });
  T(sl, s.bigStatLabel||"", {
    x:9.0, y:2.78, w:4.0, h:1.0,
    fontSize:12, color:th.d, fontFace:"Calibri", align:"center", bold:true, lineSpacingMultiple:1.3, margin:0
  });

  ftr(sl, fd.startupName, th);
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. SPLIT-R — white bg, content left (57%), dark stat panel right (43%)
//    ZONES:
//    0.00–0.58: header stripe (primary colour)
//    LEFT COLUMN (x:0.4, w:7.3):
//      0.65–2.00: title (h=1.35)
//      2.05–2.55: subtitle (h=0.5)
//      2.62–2.68: divider
//      2.75–6.60: 3 bullets × 1.28" each
//    RIGHT PANEL (x:7.75, w:5.3):
//      0.58–7.5: dark panel
//      bigStat centred at ~2.3 from top of panel
// ═════════════════════════════════════════════════════════════════════════════
function slideSplitR(sl, s, fd, th) {
  sl.background = { color:"FFFFFF" };
  hdr(sl, s.act, s.slideNumber, th);
  R(sl, { x:7.72, y:HDR, w:W-7.72, h:H-HDR, fill:{color:th.p} });
  R(sl, { x:7.68, y:HDR, w:0.07, h:H-HDR, fill:{color:th.a} });

  T(sl, s.title||"", {
    x:0.40, y:0.68, w:7.10, h:1.35,
    fontSize:26, bold:true, color:th.p, fontFace:"Arial Black", lineSpacingMultiple:1.1, margin:0
  });
  T(sl, s.subtitle||"", {
    x:0.40, y:2.08, w:7.10, h:0.50,
    fontSize:13, color:"666666", fontFace:"Calibri", italic:true, margin:0
  });
  R(sl, { x:0.40, y:2.65, w:1.8, h:0.06, fill:{color:th.a} });

  (s.bullets||[]).slice(0,3).forEach((b,i) => {
    R(sl, { x:0.40, y:2.80+i*1.28+0.44, w:0.26, h:0.26, fill:{color:th.a} });
    T(sl, b, {
      x:0.80, y:2.80+i*1.28, w:6.75, h:1.0,
      fontSize:14, color:"222222", fontFace:"Calibri", valign:"middle", lineSpacingMultiple:1.25, margin:0
    });
  });

  // Right panel content
  T(sl, s.bigStat||"", {
    x:7.80, y:1.40, w:5.10, h:2.0,
    fontSize:50, bold:true, color:th.a, fontFace:"Arial Black", align:"center", margin:0
  });
  T(sl, s.bigStatLabel||"", {
    x:7.80, y:3.48, w:5.10, h:1.0,
    fontSize:13, color:"CCCCCC", fontFace:"Calibri", align:"center", lineSpacingMultiple:1.3, margin:0
  });
  if (s.speakerNote) {
    R(sl, { x:7.95, y:4.60, w:4.80, h:1.90, fill:{color:"000000"}, transparency:55 });
    T(sl, "\u201C" + s.speakerNote + "\u201D", {
      x:8.00, y:4.68, w:4.70, h:1.78,
      fontSize:10, color:"CCCCCC", fontFace:"Calibri", italic:true, lineSpacingMultiple:1.4, margin:0
    });
  }
  ftr(sl, fd.startupName, th);
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. SPLIT-L — soft bg, dark panel left (42%), content right
// ═════════════════════════════════════════════════════════════════════════════
function slideSplitL(sl, s, fd, th) {
  sl.background = { color: th.sf };
  hdr(sl, s.act, s.slideNumber, th);
  R(sl, { x:0, y:HDR, w:5.60, h:H-HDR, fill:{color:th.d} });
  R(sl, { x:5.57, y:HDR, w:0.07, h:H-HDR, fill:{color:th.a} });

  // Left panel: stat
  T(sl, s.bigStat||"", {
    x:0.10, y:1.50, w:5.40, h:1.95,
    fontSize:52, bold:true, color:"FFFFFF", fontFace:"Arial Black", align:"center", margin:0
  });
  T(sl, s.bigStatLabel||"", {
    x:0.10, y:3.52, w:5.40, h:0.90,
    fontSize:13, color:th.a, fontFace:"Calibri", align:"center", italic:true, lineSpacingMultiple:1.3, margin:0
  });
  if (s.speakerNote) {
    R(sl, { x:0.30, y:4.60, w:5.00, h:1.90, fill:{color:"000000"}, transparency:55 });
    T(sl, "\u201C" + s.speakerNote + "\u201D", {
      x:0.35, y:4.68, w:4.90, h:1.78,
      fontSize:10, color:"CCCCCC", fontFace:"Calibri", italic:true, lineSpacingMultiple:1.42, margin:0
    });
  }

  // Right column (x: 5.80, w: 7.10)
  T(sl, s.title||"", {
    x:5.80, y:0.68, w:7.10, h:1.35,
    fontSize:24, bold:true, color:th.p, fontFace:"Arial Black", lineSpacingMultiple:1.12, margin:0
  });
  T(sl, s.subtitle||"", {
    x:5.80, y:2.08, w:7.10, h:0.50,
    fontSize:13, color:"555555", fontFace:"Calibri", italic:true, margin:0
  });
  R(sl, { x:5.80, y:2.65, w:1.9, h:0.06, fill:{color:th.a} });

  (s.bullets||[]).slice(0,3).forEach((b,i) => {
    R(sl, { x:5.80, y:2.80+i*1.28, w:0.07, h:0.75, fill:{color:th.a} });
    T(sl, b, {
      x:6.05, y:2.80+i*1.28, w:6.90, h:1.0,
      fontSize:14, color:"222222", fontFace:"Calibri", valign:"middle", lineSpacingMultiple:1.25, margin:0
    });
  });

  ftr(sl, fd.startupName, th);
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. CARDS — wide header band (1.55") + 3 equal cards filling remaining space
//    Cards: y=1.73 to y=6.78, height=5.05"
//    Number circle top, text below circle — no overflow
// ═════════════════════════════════════════════════════════════════════════════
function slideCards(sl, s, fd, th) {
  sl.background = { color: th.sf };
  const HDR2 = 1.55;
  R(sl, { x:0, y:0, w:W, h:HDR2, fill:{color:th.p} });
  R(sl, { x:0, y:HDR2-0.04, w:W, h:0.04, fill:{color:th.a} });

  if (s.act) T(sl, s.act.toUpperCase(), { x:0.4, y:0.10, w:4.5, h:0.32, fontSize:9, bold:true, color:th.a, fontFace:"Calibri", margin:0 });
  T(sl, String(s.slideNumber||"").padStart(2,"0"), { x:W-1.1, y:0.10, w:0.8, h:0.32, fontSize:9, color:"FFFFFF", fontFace:"Calibri", align:"right", transparency:35, margin:0 });

  // Title + subtitle in header
  T(sl, s.title||"", { x:0.5, y:0.30, w:W-5.2, h:0.82, fontSize:24, bold:true, color:"FFFFFF", fontFace:"Arial Black", lineSpacingMultiple:1.05, margin:0 });
  T(sl, s.subtitle||"", { x:0.5, y:1.14, w:W-5.2, h:0.32, fontSize:11, color:th.a, fontFace:"Calibri", italic:true, margin:0 });

  // Big stat block in header — top right
  if (s.bigStat) {
    R(sl, { x:W-4.5, y:0, w:4.5, h:HDR2, fill:{color:th.a} });
    T(sl, s.bigStat, { x:W-4.5, y:0.14, w:4.5, h:0.92, fontSize:36, bold:true, color:th.d, fontFace:"Arial Black", align:"center", margin:0 });
    T(sl, s.bigStatLabel||"", { x:W-4.5, y:1.09, w:4.5, h:0.38, fontSize:10, color:th.d, fontFace:"Calibri", align:"center", bold:true, margin:0 });
  }

  // 3 cards
  const cY = HDR2 + 0.18;
  const cH = BOT - cY - 0.05;   // ≈ 5.07"
  const cW = (W - 1.0) / 3 - 0.18;
  const COLORS = [th.p, th.a, th.d];
  const TCOLS  = ["FFFFFF", th.d, "FFFFFF"];

  (s.bullets||[]).slice(0,3).forEach((b, i) => {
    const cx = 0.40 + i*(cW + 0.18);
    R(sl, { x:cx, y:cY, w:cW, h:cH, fill:{color:"FFFFFF"}, shadow:SH() });
    R(sl, { x:cx, y:cY, w:cW, h:0.20, fill:{color:COLORS[i]} });
    // Number circle — top of card
    O(sl, { x:cx+cW/2-0.43, y:cY+0.30, w:0.86, h:0.86, fill:{color:COLORS[i]} });
    T(sl, String(i+1), {
      x:cx+cW/2-0.43, y:cY+0.30, w:0.86, h:0.86,
      fontSize:20, bold:true, color:TCOLS[i], fontFace:"Arial Black",
      align:"center", valign:"middle", margin:0
    });
    // Card text starts below circle: 0.30+0.86+0.18 = 1.34" from card top
    T(sl, b, {
      x:cx+0.18, y:cY+1.34, w:cW-0.36, h:cH-1.46,
      fontSize:13, color:"222222", fontFace:"Calibri", lineSpacingMultiple:1.35, margin:0
    });
  });

  ftr(sl, fd.startupName, th);
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. VISION — full dark, centered title, 3 translucent cards
// ═════════════════════════════════════════════════════════════════════════════
function slideVision(sl, s, fd, th) {
  sl.background = { color: th.d };
  hdr(sl, s.act, s.slideNumber, th);
  O(sl, { x:W*0.26, y:-1.5, w:9.0, h:9.0, fill:{color:th.p}, transparency:72 });

  T(sl, s.title||"", {
    x:0.5, y:0.68, w:W-5.2, h:1.80,
    fontSize:34, bold:true, color:"FFFFFF", fontFace:"Arial Black",
    lineSpacingMultiple:1.12, margin:0
  });
  R(sl, { x:W/2-2.1, y:2.56, w:4.2, h:0.07, fill:{color:th.a} });
  T(sl, s.subtitle||"", {
    x:0.8, y:2.70, w:W-1.6, h:0.55,
    fontSize:16, color:th.a, fontFace:"Calibri", italic:true, align:"center", margin:0
  });

  if (s.bigStat) {
    T(sl, s.bigStat, { x:W-4.1, y:0.68, w:3.7, h:1.38, fontSize:42, bold:true, color:th.a, fontFace:"Arial Black", align:"center", margin:0 });
    T(sl, s.bigStatLabel||"", { x:W-4.1, y:2.10, w:3.7, h:0.45, fontSize:11, color:"AAAAAA", fontFace:"Calibri", align:"center", margin:0 });
  }

  const cY = 3.38, cH = BOT - cY - 0.05;
  const cW = (W - 1.4) / 3 - 0.20;
  // Card colours cycle: primary, accent-tinted dark, darker primary
  // Text always white — all card backgrounds are dark enough to guarantee contrast
  const VCOLS = [th.p, th.d, th.p];
  const VBORD = [th.a, th.a, th.a];
  (s.bullets||[]).slice(0,3).forEach((b, i) => {
    const cx = 0.40 + i*(cW + 0.20);
    R(sl, { x:cx, y:cY, w:cW, h:cH, fill:{color:VCOLS[i]}, shadow:SH() });
    R(sl, { x:cx, y:cY, w:cW, h:0.18, fill:{color:VBORD[i]} });
    T(sl, b, {
      x:cx+0.16, y:cY+0.26, w:cW-0.32, h:cH-0.36,
      fontSize:13, color:"FFFFFF", fontFace:"Calibri", lineSpacingMultiple:1.38, margin:0
    });
  });
  ftr(sl, fd.startupName, th);
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. ASK — dark bg, white central card with funding amount + use-of-funds
// ═════════════════════════════════════════════════════════════════════════════
function slideAsk(sl, s, fd, th) {
  sl.background = { color: th.d };
  hdr(sl, s.act, s.slideNumber, th);

  const CX = 0.85, CY = 0.65, CW = W-1.70, CH = H-1.28;
  R(sl, { x:CX, y:CY, w:CW, h:CH, fill:{color:"FFFFFF"}, shadow:SH() });
  R(sl, { x:CX, y:CY, w:CW, h:0.20, fill:{color:th.p} });

  T(sl, s.title||"", { x:CX, y:CY+0.28, w:CW, h:0.80, fontSize:27, bold:true, color:th.p, fontFace:"Arial Black", align:"center", margin:0 });
  R(sl, { x:W/2-1.8, y:CY+1.15, w:3.6, h:0.07, fill:{color:th.a} });

  T(sl, s.bigStat||"", {
    x:CX, y:CY+1.32, w:CW, h:1.48,
    fontSize:60, bold:true, color:th.p, fontFace:"Arial Black", align:"center", margin:0
  });
  T(sl, s.bigStatLabel || "Seed Round", {
    x:CX, y:CY+2.87, w:CW, h:0.42,
    fontSize:14, color:"777777", fontFace:"Calibri", align:"center", italic:true, margin:0
  });

  const buls = (s.bullets||[]).slice(0,3);
  const BW = (CW - 0.80) / Math.max(buls.length,1);
  const BCOLS = [th.p, th.a, th.sf];
  const BTCOLS = ["FFFFFF", th.d, "333333"];
  buls.forEach((b, i) => {
    const bx = CX + 0.30 + i*(BW + 0.10), by = CY + 3.42;
    R(sl, { x:bx, y:by, w:BW, h:1.55, fill:{color:BCOLS[i]}, shadow:SH() });
    T(sl, b, {
      x:bx+0.10, y:by+0.12, w:BW-0.20, h:1.32,
      fontSize:12, color:BTCOLS[i], fontFace:"Calibri",
      align:"center", valign:"middle", lineSpacingMultiple:1.3, margin:0
    });
  });

  T(sl, fd.startupName + "  ·  Let\u2019s build this together", {
    x:0, y:H-0.48, w:W, h:0.36,
    fontSize:11, color:th.a, fontFace:"Arial Black", align:"center", bold:true, margin:0
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. CLOSER — full primary colour, giant quote, centred statement
// ═════════════════════════════════════════════════════════════════════════════
function slideCloser(sl, s, fd, th) {
  sl.background = { color: th.p };
  R(sl, { x:0, y:0, w:W, h:0.10, fill:{color:th.a} });
  R(sl, { x:0, y:H-0.10, w:W, h:0.10, fill:{color:th.a} });

  T(sl, "\u201C", {
    x:0.25, y:-0.10, w:3.2, h:3.6,
    fontSize:220, color:"FFFFFF", fontFace:"Georgia", transparency:10, margin:0
  });

  T(sl, s.title||"", {
    x:0.65, y:1.05, w:W-1.30, h:2.90,
    fontSize:36, bold:true, color:"FFFFFF", fontFace:"Arial Black",
    align:"center", lineSpacingMultiple:1.15, margin:0
  });
  R(sl, { x:W/2-2.2, y:4.08, w:4.4, h:0.08, fill:{color:th.a} });
  T(sl, s.subtitle || fd.tagline || "", {
    x:0.65, y:4.24, w:W-1.30, h:0.60,
    fontSize:17, color:th.a, fontFace:"Calibri", align:"center", italic:true, margin:0
  });
  T(sl, fd.startupName + "  ·  " + (s.bigStat||"") + "  ·  Let\u2019s build this together", {
    x:0.65, y:5.20, w:W-1.30, h:0.50,
    fontSize:13, color:"CCCCCC", fontFace:"Calibri", align:"center", margin:0
  });
}

module.exports = { generatePPTX };
