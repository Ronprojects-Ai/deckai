// services/claude.js  — Deep prompt enrichment + content generation
// The core idea: BEFORE sending to Claude, we enrich sparse user inputs
// with industry-specific benchmarks, YC narrative frameworks, India market data,
// competitor landscape, and investor psychology hooks. Claude then receives
// a fully-formed strategic brief — not raw form data.

const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── INDUSTRY INTELLIGENCE DATABASE ──────────────────────────────────────────
// Each sector has: benchmark metrics, key India stats, common investor objections,
// moat patterns, comparable companies, and narrative hooks.
const INDUSTRY_INTEL = {
  "Fintech": {
    indiaStats: [
      "UPI processed 9.3B transactions worth ₹14.7L Cr in Dec 2024",
      "India has 750M+ smartphone users; only 23% have access to formal credit",
      "₹3.5L Cr MSME credit gap — India's biggest unsolved financial problem",
      "India's fintech market projected to reach $1.5T by 2030 (BCG 2024)",
      "Only 16% of Indians have health/life insurance despite 1.4B population",
    ],
    benchmarks: {
      goodCAC: "₹200–800 for digital-first, ₹1,500–4,000 for offline-touch",
      goodLTV: "₹3,000–25,000 depending on product (lending vs. insurance vs. payments)",
      goodLTVCAC: "3:1 minimum; top fintechs run 8:1",
      goodGrossMargin: "60–80% for SaaS/platform; 15–30% for lending",
      typicalARR: "₹2–8 Cr ARR at seed stage for B2B fintech",
    },
    investorObjections: [
      "Regulatory risk (RBI, SEBI) — address with specific compliance roadmap",
      "Why not Razorpay/Paytm — answer with your specific niche/geography",
      "Unit economics on lending — address with NPA rates and risk model",
    ],
    moatPatterns: ["Proprietary credit scoring data", "Distribution via WhatsApp/UPI ecosystem", "RBI NBFC license as barrier"],
    comparables: ["Slice (raised $220M)", "KreditBee ($200M)", "Jar ($65M)", "Smallcase ($40M)"],
    narrativeHook: "India is adding 50M first-time credit users per year — most are invisible to traditional banks",
  },
  "Edtech": {
    indiaStats: [
      "India has 250M K-12 students — largest in the world",
      "Only 1% of India's 30M college students get quality placement support",
      "₹2L Cr spent annually on private tutoring — 87% in unorganized market",
      "Post-BYJU's collapse: trust gap = massive opportunity for honest, outcome-focused players",
      "Tier-2/3 cities have 180M students with no access to quality coaching",
    ],
    benchmarks: {
      goodCAC: "₹800–3,000 for B2C; ₹8,000–25,000 for B2B school partnerships",
      goodLTV: "₹5,000–40,000 per student lifecycle",
      goodCompletionRate: "35%+ is good; 60%+ is exceptional",
      goodNPS: "50+ is strong in edtech",
      typicalARR: "₹1–5 Cr ARR at seed; B2B school SaaS can reach ₹8 Cr",
    },
    investorObjections: [
      "BYJU's shadow — prove your unit economics are sustainable from Day 1",
      "Content commoditization — show defensible IP or community moat",
      "CAC payback — demonstrate 6-12 month payback with real cohort data",
    ],
    moatPatterns: ["Outcome-linked pricing", "Teacher network effects", "Vernacular content moat", "Employer partnerships"],
    comparables: ["PhysicsWallah ($2.8B)", "Teachmint ($150M)", "Classplus ($75M)", "Apni Pathshala (emerging)"],
    narrativeHook: "Every year, 5M engineering graduates enter the market — 70% are unemployable. The education system failed them. We fix the last mile.",
  },
  "Healthtech": {
    indiaStats: [
      "India has 1 doctor per 834 patients vs WHO recommendation of 1:600",
      "65% of Indians pay 100% out-of-pocket for healthcare — no insurance",
      "India's healthtech market: $21B by 2025 (KPMG), growing at 39% CAGR",
      "150M+ chronic disease patients with no continuous monitoring solution",
      "Mental health: 150M Indians need care; only 9,000 psychiatrists exist",
    ],
    benchmarks: {
      goodCAC: "₹300–1,200 for digital; ₹2,000–8,000 for clinic partnerships",
      goodLTV: "Chronic care: ₹8,000–50,000/year; Acute: ₹500–2,000 per episode",
      goodRetention: "Monthly active: 40%+ good; 70%+ exceptional for chronic care",
      typicalARR: "B2B hospital SaaS: ₹5–20 Cr ARR at seed",
    },
    investorObjections: [
      "Regulatory/CDSCO compliance — show clear path",
      "Doctor adoption — prove with pilot data and specific doctor count",
      "Unit economics of home visits/consultations — show per-consultation margin",
    ],
    moatPatterns: ["Proprietary health data flywheel", "Doctor network lock-in", "Insurance TPA partnerships", "Hospital system integrations"],
    comparables: ["PharmEasy ($5.6B peak)", "Practo ($1B+)", "Curelink ($20M)", "Niramai ($10M)"],
    narrativeHook: "India will have 100M diabetics by 2030. Most will never see an endocrinologist. We are the endocrinologist.",
  },
  "SaaS / B2B": {
    indiaStats: [
      "India has 63M MSMEs — only 15% use any business software",
      "Indian SaaS companies will reach $35B ARR by 2025 (SaaSBoomi)",
      "Indian B2B SaaS now has 10 unicorns; another 50+ are on the path",
      "SMB software penetration in India is at 2010-level compared to the US",
      "WhatsApp Business has 500M+ Indian users — new distribution channel",
    ],
    benchmarks: {
      goodARR: "₹1–3 Cr ARR at seed; ₹8–15 Cr at Series A",
      goodNRR: "110%+ is good; 130%+ is exceptional",
      goodChurn: "Monthly churn under 2% (SMB) or under 0.5% (enterprise)",
      goodCAC: "SMB: ₹5,000–20,000; Enterprise: ₹50,000–5L",
      goodLTVCAC: "3:1 minimum; top SaaS runs 6:1+",
    },
    investorObjections: [
      "Why not use Zoho/Freshworks — answer with your specific vertical depth",
      "SMB churn risk — show retention data and annual contract conversion",
      "Sales cycle length — prove with pilot-to-close timeline data",
    ],
    moatPatterns: ["Vertical-specific workflows", "Data network effects", "WhatsApp-native distribution", "API ecosystem lock-in"],
    comparables: ["Leadsquared ($150M)", "Chargebee ($300M)", "HighLevel (US comparable)", "Skit.ai ($23M)"],
    narrativeHook: "63 million Indian MSMEs run on WhatsApp, paper, and prayer. We are the operating system for the next 50M businesses.",
  },
  "E-commerce": {
    indiaStats: [
      "Indian e-commerce: ₹15L Cr by 2026 — but only 8% of total retail",
      "Quick commerce growing at 70% YoY; expected ₹40,000 Cr by 2025",
      "650M internet users; 200M+ online shoppers — 3x growth potential",
      "Tier-2/3 cities: fastest growing online shopping segment at 25% YoY",
      "Return rate: 25–40% in fashion; 8–12% in grocery — massive cost",
    ],
    benchmarks: {
      goodContributionMargin: "8–15% for marketplace; 20–35% for D2C brands",
      goodCAC: "₹200–800 organic; ₹600–2,000 paid",
      goodRepeatRate: "40%+ in 90 days is strong; 60%+ is exceptional",
      goodAOV: "₹500–1,500 for daily needs; ₹2,000–8,000 for fashion/lifestyle",
      goodNPS: "40+ for e-commerce is exceptional",
    },
    investorObjections: [
      "Amazon/Flipkart competition — show your specific niche defense",
      "Logistics costs — prove per-order economics",
      "Working capital requirements — show inventory turns and cash cycle",
    ],
    moatPatterns: ["Category exclusivity", "Vernacular community building", "Subscription lock-in", "Private label margins"],
    comparables: ["Meesho ($3.9B)", "Nykaa ($1.2B)", "Dealshare ($165M)", "Otipy ($119M)"],
    narrativeHook: "India's next 200M online shoppers don't speak English and don't live in metros. They shop on WhatsApp and trust word-of-mouth.",
  },
  "Agritech": {
    indiaStats: [
      "600M Indians depend on agriculture; average farmer earns ₹10,000/month",
      "Post-harvest losses: ₹92,000 Cr/year — 20-30% of produce wasted",
      "Only 2% of India's 86M small farmers have access to formal credit",
      "India's agritech market: $24B by 2025 (FICCI-KPMG)",
      "PM-KISAN, PMFBY creating massive digital infrastructure for farmer reach",
    ],
    benchmarks: {
      goodCAC: "₹150–600 via digital; ₹800–2,500 via field agents",
      goodGMV: "₹10–50L GMV/month at seed stage",
      goodFarmerRetention: "60%+ season-over-season is strong",
      typicalARR: "B2B agri-SaaS: ₹2–8 Cr ARR at seed",
    },
    investorObjections: [
      "Farmer digital literacy — show onboarding data and vernacular UX",
      "Seasonality risk — show multi-crop, multi-season data",
      "Last-mile distribution — prove with specific district/block coverage",
    ],
    moatPatterns: ["Farmer trust networks (FPO relationships)", "Multi-season data moat", "Agri-input distribution integration"],
    comparables: ["DeHaat ($47M)", "Ninjacart ($145M)", "Waycool ($130M)", "Jai Kisan ($30M)"],
    narrativeHook: "India's farmer earns less per day than a Bangalore software engineer spends on coffee. We're changing that supply chain equation.",
  },
  "Logistics / Supply Chain": {
    indiaStats: [
      "India's logistics cost: 13-14% of GDP vs 8% in China — ₹20L Cr opportunity",
      "GST + FASTag created $50B in logistics efficiency waiting to be captured",
      "5M trucks in India; only 15% have telematics or route optimization",
      "E-commerce logistics growing at 30% YoY — 4B shipments by 2026",
      "Cold chain infrastructure gap: only 35% of perishables have cold storage",
    ],
    benchmarks: {
      goodRevPerTruck: "₹2–4L/month per truck for freight aggregators",
      goodFillRate: "85%+ on-time delivery is industry benchmark",
      goodTake: "8–15% take rate for logistics marketplace",
      goodNPS: "50+ for B2B logistics is exceptional",
    },
    investorObjections: [
      "Asset-heavy model concern — show asset-light path",
      "Driver retention — prove with attrition rates and driver NPS",
      "Competitor (Delhivery, Shadowfax) — show your specific niche",
    ],
    moatPatterns: ["Route density data", "Driver ecosystem lock-in", "Hyperlocal dark store network", "Cold chain infrastructure"],
    comparables: ["Porter ($500M)", "Shiprocket ($235M)", "Delhivery ($1.5B)", "BlackBuck ($800M)"],
    narrativeHook: "India moves ₹40L Cr of goods every year on 5M trucks navigating routes planned by memory and prayer. We're the GPS for Indian supply chains.",
  },
  "Consumer App": {
    indiaStats: [
      "India is the #2 app download market globally — 28B downloads in 2024",
      "Indian users spend 4.5 hours/day on mobile — world's highest",
      "Short video market: 600M users across platforms — vernacular is king",
      "India has 350M+ Gen-Z users; fastest growing digital consumer segment",
      "Mobile gaming: ₹15,000 Cr market growing at 28% YoY",
    ],
    benchmarks: {
      goodDAU_MAU: "20%+ is good; 40%+ is exceptional (WhatsApp-like)",
      goodD1Retention: "30%+ Day-1; 15%+ Day-7; 8%+ Day-30",
      goodARPU: "₹50–300/month for subscription; ₹2–15 for ad-supported",
      goodCAC: "₹15–60 via digital for consumer apps",
    },
    investorObjections: [
      "Monetization path — show ARPU trajectory and conversion funnel",
      "Meta/Google competition for attention — show engagement defensibility",
      "Virality vs. paid growth mix — prove organic growth coefficient",
    ],
    moatPatterns: ["Social graph lock-in", "UGC content flywheel", "Notification/habit loops", "Payment integration stickiness"],
    comparables: ["ShareChat ($5B)", "Josh (DailyHunt, $805M)", "Kutumb ($100M)", "Lokal ($25M)"],
    narrativeHook: "India's next 200M internet users don't want Instagram. They want connection in their own language, their own culture.",
  },
  "Deep Tech / AI": {
    indiaStats: [
      "India produces 1.5M engineering graduates/year — deep tech talent at 1/5th US cost",
      "India's AI market: $17B by 2027 (IDC) — enterprise adoption accelerating",
      "BharatGPT, Krutrim: Indian language AI models emerging — huge B2G opportunity",
      "ONDC, UPI, DigiLocker creating open data infrastructure for AI applications",
      "Defence, space, semiconductor: India's deep tech push = ₹75,000 Cr govt investment",
    ],
    benchmarks: {
      goodARR: "₹2–8 Cr ARR at seed for B2B AI; $500K+ for global SaaS",
      goodGrossMargin: "70–85% for AI SaaS (vs. 40% for pure services)",
      goodModelAccuracy: "Depends on domain — always compare vs. human baseline",
      typicalSalesCAC: "₹30,000–3L for enterprise AI pilots",
    },
    investorObjections: [
      "OpenAI/Google competition — show domain-specific fine-tuning moat",
      "Hallucination/accuracy risk — show evaluation framework and error rates",
      "Sales cycle for enterprise AI — show pilot-to-POC-to-contract timeline",
    ],
    moatPatterns: ["Proprietary training data", "Domain expert feedback loop", "Regulated industry compliance moat", "Hardware+software integration"],
    comparables: ["Sarvam AI ($41M)", "Observe.AI ($115M)", "Yellow.ai ($78M)", "Mad Street Den ($30M)"],
    narrativeHook: "India has the world's most complex vernacular data problem and the world's cheapest AI engineers. The next foundation model for Bharat will be built here.",
  },
  "Climate / Cleantech": {
    indiaStats: [
      "India committed to 500GW renewable energy by 2030 — ₹25L Cr investment",
      "India: world's 3rd largest carbon emitter — and fastest growing clean energy market",
      "EV market: 1.5M EVs sold in 2024; target 30% EV penetration by 2030",
      "Carbon credit market: India could generate $2B+ annually by 2030",
      "Green hydrogen: India targeting 5 MMT/year production by 2030",
    ],
    benchmarks: {
      goodPaybackPeriod: "Under 3 years for industrial customers; under 5 for residential",
      goodGrossMargin: "30–55% for cleantech products; 60–75% for climate SaaS",
      goodChurnRate: "Under 5% annually for B2B industrial clients",
      typicalARR: "₹3–12 Cr ARR at seed for climate B2B",
    },
    investorObjections: [
      "Policy risk — show revenue model that works with/without subsidies",
      "Long sales cycles for industrial — show pilot-to-scale data",
      "Hardware capex — show asset-light model or financing partnerships",
    ],
    moatPatterns: ["Proprietary efficiency algorithms", "Utility/DISCOM partnerships", "Carbon credit methodology IP", "First-mover in specific geography"],
    comparables: ["Ather Energy ($400M)", "Log9 Materials ($50M)", "Climes ($10M)", "SolarSquare ($40M)"],
    narrativeHook: "India will spend ₹25L Crore on clean energy in this decade. The company that optimizes that deployment will be worth more than any fossil fuel business.",
  },
  "Other": {
    indiaStats: [
      "India's startup ecosystem: 115,000+ startups, 111 unicorns, $450B+ value created",
      "India digital economy: $1T by 2030 (Morgan Stanley) — still early innings",
      "750M+ smartphone users; 350M daily UPI transactions; world's largest digital payments market",
      "India's middle class: 300M today, 500M by 2030 — spending ₹85L Cr/year",
      "Tier-2/3 cities: 60% of India's population, only 20% of startup focus — massive white space",
    ],
    benchmarks: {
      seedARR: "₹1–5 Cr ARR is respectable for seed stage",
      seedGrowth: "20%+ MoM growth for 6+ months signals product-market fit",
      seedRetention: "30%+ monthly retention is strong for consumer; 85%+ for B2B",
      ltvCAC: "3:1 minimum; 5:1+ is fundable",
    },
    investorObjections: [
      "Market size — always quantify TAM/SAM/SOM with bottom-up calculation",
      "Team domain expertise — lead with the founder-market fit story",
      "Competition — show specific differentiation vs. each named alternative",
    ],
    moatPatterns: ["Network effects", "Data flywheel", "Switching costs", "Distribution exclusivity"],
    comparables: ["Research your specific category for best comparables"],
    narrativeHook: "India's next decade will create more new consumer categories than the last three decades combined. The question is: who builds the infrastructure?",
  },
};

// ─── TEAM CREDENTIAL ENRICHER ─────────────────────────────────────────────────
function enrichTeam(team, industry) {
  const teamLower = team.toLowerCase();
  const enhancements = [];

  if (teamLower.includes("iit") || teamLower.includes("iim") || teamLower.includes("nit"))
    enhancements.push("elite Indian institution pedigree with proven technical/analytical rigor");
  if (teamLower.includes("swiggy") || teamLower.includes("zomato") || teamLower.includes("flipkart") || teamLower.includes("meesho"))
    enhancements.push("has scaled operations in India's hyper-competitive consumer internet market");
  if (teamLower.includes("mckinsey") || teamLower.includes("bain") || teamLower.includes("bcg") || teamLower.includes("goldman"))
    enhancements.push("strategy/finance background with exposure to ₹1000Cr+ business decisions");
  if (teamLower.includes("google") || teamLower.includes("microsoft") || teamLower.includes("amazon") || teamLower.includes("meta"))
    enhancements.push("big-tech engineering depth with global product standards");
  if (teamLower.includes("yc") || teamLower.includes("sequoia") || teamLower.includes("accel"))
    enhancements.push("previously backed by top-tier global investors — credibility signal");
  if (teamLower.includes("founder") || teamLower.includes("serial") || teamLower.includes("exit"))
    enhancements.push("founder with prior startup experience — knows what failure looks like and how to avoid it");

  return enhancements.length > 0
    ? `${team}\n[TEAM INSIGHT: ${enhancements.join("; ")}]`
    : team;
}

// ─── MARKET SIZE ENRICHER ─────────────────────────────────────────────────────
function enrichMarket(mkt, industry) {
  const intel = INDUSTRY_INTEL[industry] || INDUSTRY_INTEL["Other"];
  return `${mkt}
[MARKET INTELLIGENCE: Break into TAM (total India market), SAM (serviceable segment you target), SOM (realistically capturable in 3 years). Use these benchmarks: ${intel.indiaStats.slice(0,2).join(" | ")}. Comparable funding rounds: ${intel.comparables.join(", ")}]`;
}

// ─── TRACTION ENRICHER ────────────────────────────────────────────────────────
function enrichTraction(trac, industry) {
  const intel = INDUSTRY_INTEL[industry] || INDUSTRY_INTEL["Other"];
  const bm = intel.benchmarks;
  const bmText = Object.entries(bm).slice(0,3).map(([k,v])=>`${k}: ${v}`).join(" | ");

  if (!trac || trac.trim().length < 10) {
    return `[PRE-TRACTION — CREATE PLAUSIBLE EARLY METRICS] Industry benchmarks to anchor against: ${bmText}. Write aspirational-but-credible claims: e.g. "50 beta users, ₹2L in LOIs signed, 3 enterprise pilot conversations". Signal momentum even without revenue.`;
  }
  return `${trac}
[BENCHMARK CONTEXT: Good ${industry} metrics — ${bmText}. Frame traction relative to these benchmarks to show investor you're ahead of the curve.]`;
}

// ─── BUSINESS MODEL ENRICHER ─────────────────────────────────────────────────
function enrichBizModel(biz, industry) {
  if (!biz || biz.trim().length < 5) {
    const intel = INDUSTRY_INTEL[industry] || INDUSTRY_INTEL["Other"];
    return `[INFER THE OPTIMAL BUSINESS MODEL for ${industry}. Consider these moat patterns: ${intel.moatPatterns.join(", ")}. Show multiple revenue streams and path to 70%+ gross margin.]`;
  }
  return biz;
}

// ─── MAIN BRIEF BUILDER ───────────────────────────────────────────────────────
function buildEnrichedBrief(fd) {
  const industry = fd.industry || "Other";
  const intel    = INDUSTRY_INTEL[industry] || INDUSTRY_INTEL["Other"];
  const name     = fd.startupName;
  const hasAsk   = (fd.ask || "").trim().length > 3;
  const hasUoF   = (fd.useOfFunds || "").trim().length > 5;

  const enrichedTeam    = enrichTeam(fd.team, industry);
  const enrichedMarket  = enrichMarket(fd.marketSize, industry);
  const enrichedTraction= enrichTraction(fd.traction, industry);
  const enrichedBizModel= enrichBizModel(fd.bizModel, industry);

  return `
╔══════════════════════════════════════════════════════════════╗
  STARTUP BRIEF — ${name.toUpperCase()} | SECTOR: ${industry}
╚══════════════════════════════════════════════════════════════╝

━━ FOUNDER INPUTS (verbatim) ━━
COMPANY:    ${name}
TAGLINE:    ${fd.tagline}

THE PROBLEM (founder's words — preserve the authenticity):
${fd.problem}

THE SOLUTION (founder's words — preserve the core insight):
${fd.solution}

━━ ENRICHED CONTEXT (use this to amplify, not replace, founder inputs) ━━

MARKET SIZE (enriched):
${enrichedMarket}

BUSINESS MODEL (enriched):
${enrichedBizModel}

TRACTION (enriched):
${enrichedTraction}

TEAM (enriched):
${enrichedTeam}

FUNDING ASK:  ${hasAsk ? fd.ask : "[INFER: seed round 12–24 months runway. Calculate based on industry burn rates for this stage.]"}
USE OF FUNDS: ${hasUoF ? fd.useOfFunds : "[INFER: 40-50% product/tech, 30-35% sales/growth, 15-20% ops. Show specific hiring and milestone plan.]"}

━━ INDIA 2025 INTELLIGENCE FOR THIS SECTOR ━━
${intel.indiaStats.map((s,i)=>`${i+1}. ${s}`).join("\n")}

━━ INVESTOR OBJECTIONS TO PRE-EMPT (address in slides 14-16) ━━
${intel.investorObjections.map((o,i)=>`${i+1}. ${o}`).join("\n")}

━━ MOAT PATTERNS FOR THIS SECTOR (use for slide 14) ━━
${intel.moatPatterns.join(" | ")}

━━ COMPARABLE COMPANIES (for "Why We Win" slide) ━━
${intel.comparables.join(", ")}

━━ CORE NARRATIVE HOOK (your "Priya moment" anchor) ━━
${intel.narrativeHook}

━━ COMPETITIVE BENCHMARKS ━━
${Object.entries(intel.benchmarks).map(([k,v])=>`${k}: ${v}`).join("\n")}
`.trim();
}

// ─── MASTER PROMPT ────────────────────────────────────────────────────────────
async function generateDeckContent(formData) {
  const brief = buildEnrichedBrief(formData);

  const prompt = `You are the world's best startup pitch writer — the person behind the Airbnb Series B deck, the Stripe seed memo, and Sequoia India's internal playbook. You have studied every successful Indian startup pitch from Zepto to CRED. You know that investors in India fund founders who feel inevitable — people who see something others don't, in a market that's about to explode.

Your job today: transform the startup brief below into a 20-slide investor narrative so compelling that a Sequoia or Lightspeed partner forwards it to their partners before the meeting ends.

${brief}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NARRATIVE PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The deck must feel like a DOCUMENTARY, not a sales pitch.
- Slide 1: Make them lean forward
- Slides 2-4: Make them feel the pain like it's their own  
- Slides 5-8: Give them the "aha" moment — why this, why now, why this team
- Slides 9-13: Prove it's real with numbers that demand respect
- Slides 14-17: Show the moat and the 5-year vision
- Slides 18-20: Make the ask feel like the only logical next step

The PROTAGONIST of this deck is a real Indian person with a real problem.
Give them a name (Priya, Rahul, Arjun, Kavita, etc.), a specific Indian city (not just "India"),
and a specific daily moment where the problem manifests. Then zoom out to millions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK: WRITE A 20-SLIDE INVESTOR NARRATIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5-ACT STRUCTURE:
ACT 1 (slides 1–4):   THE WORLD TODAY  — Make the investor FEEL the pain viscerally
ACT 2 (slides 5–8):   THE REVELATION   — The non-obvious insight + why now
ACT 3 (slides 9–13):  THE PROOF        — Traction, market, business model, unit economics
ACT 4 (slides 14–17): THE FUTURE       — Moat, competition, roadmap, vision
ACT 5 (slides 18–20): THE ASK          — Team credentials, funding ask, unforgettable closer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12 IRONCLAD CONTENT RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — TITLES ARE CLAIMS, NOT LABELS
  BAD: "Market Opportunity" | GOOD: "A ₹6.5L Cr Market With No Clear Winner"
  BAD: "Our Solution"       | GOOD: "Groceries in 10 Minutes. Not 45. Not Tomorrow. Now."
  Every title must contain a verb OR a number OR a provocative claim.

RULE 2 — SLIDES 2–4 OPEN WITH A NAMED HUMAN BEING
  Name them. Give them a job, a city, a specific frustration.
  "Kavita is a 34-year-old software engineer in Bhopal. At 6 PM, she opens her fridge..."
  THEN zoom out to millions of Kavitas. This is non-negotiable.

RULE 3 — EVERY BULLET IS 2–3 FULL SENTENCES (40–60 WORDS)
  FORMAT: "Bold Label: [First sentence with specific fact/number]. [Second sentence explaining why it matters]. [Optional third sentence with concrete implication or benchmark comparison]."
  BAD: "We have strong retention"
  BAD: "73% of users return within 60 days"
  GOOD: "91% month-1 retention — vs 62% SMB SaaS average: Average clinic keeps paying after month 1 because switching means losing their entire patient history. The product creates medical-record lock-in that no competitor can undo."
  Every bullet must feel like a mini-paragraph, not a headline. Fill the space. Investors read every word.

RULE 4 — BIGSTAT STOPS THE SCROLL
  The bigStat must be dramatic and almost unbelievable but true.
  Format: "₹8L Cr" / "350M" / "73%" / "10 min" / "₹0 CAC" / "23x" / "Day 1"

RULE 5 — INDIA SPECIFICITY IS NON-NEGOTIABLE
  Use real India 2024-2026 data from the intelligence above. UPI, Aadhaar, PM-KISAN,
  GST, Jio, WhatsApp — these are your infrastructure. Ground every claim in India reality.

RULE 6 — ONE CORE IDEA PER SLIDE — NO MORE
  If you need 2 things, use 2 slides. That's why we have 20.

RULE 7 — SPEAKER NOTES = THE SENTENCE A VC REPEATS TO THEIR PARTNERS
  Format: "What's wild is..." or "Did you know that..." or "The number that broke our minds was..."
  It must be quotable. Short. Surprising. Something they'll say at dinner.

RULE 8 — PRE-EMPT THE TOP 3 INVESTOR OBJECTIONS
  Use the objections listed in the brief. Address them directly in slides 14-16.
  Don't be defensive — turn each objection into proof of your insight.

RULE 9 — SLIDES 9-13 ARE NUMBER-HEAVY
  Use the benchmark data provided. Show you know your numbers cold.
  CAC, LTV, gross margin, churn, NRR — at least one hard metric per slide in this act.

RULE 10 — SLIDE 20 CLOSER = ONE UNFORGETTABLE LINE
  The sentence that stays in an investor's mind at 2 AM.
  Short. Poetic. Bold. NOT a summary. A declaration.
  Example: "India's next 500 million deserve the same 10-minute city that Mumbai has. We're building it."

RULE 11 — AVOID ALL GENERIC PHRASES
  NEVER write: "We are disrupting", "game-changer", "AI-powered solution", "passionate team",
  "unique opportunity", "first-mover advantage", "leverage synergies", "end-to-end platform"
  Instead: be specific, concrete, human. Show don't tell.

RULE 12 — THE FOUNDING STORY MUST FEEL TRUE
  In slide 2, write the story as if the founder told you in person, late at night.
  The details matter: the exact moment of insight, the specific frustration, the personal connection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE-BY-SLIDE INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

S01 [COVER]: Company name + your best claim about the market or traction.
  3 bullets = your 3 most impressive proof points. bigStat = most dramatic number you have.
  Subtitle = the one sentence that makes a partner want to flip to slide 2.

S02 [STORY — THE HUMAN]: Named protagonist, specific Indian city, specific daily frustration.
  Walk through their day. Show the exact moment the pain happens.
  End with: "There are 47 million [Kavitas] in India. Every single day."
  bigStat = scale of people affected.

S03 [STORY — SCALE OF PAIN]: Quantify the problem with 3 brutal India-specific statistics.
  Each bullet = a different dimension of the problem (time lost, money wasted, opportunity missed).
  bigStat = the total ₹ value or scale number that makes jaws drop.

S04 [SPLITR — WHY SOLUTIONS FAIL]: Name 2-3 specific competitors by name. Show exactly how each fails.
  Be surgical: "Swiggy takes 35 min. BigBasket requires next-day booking. JioMart has 40% stockout."
  bigStat = how much of the market is still unserved.

S05 [STORY — THE REVELATION]: The ONE macro shift (infrastructure, behavior, regulation, demographics)
  that makes this moment the inflection point. This is your "why now" slide.
  "3 years ago this was impossible. Today, with [UPI/Aadhaar/Jio/WhatsApp], it's inevitable."
  bigStat = the scale of the enabling infrastructure.

S06 [SPLITL — THE INSIGHT]: Your contrarian truth. "Everyone thinks X. We discovered Y."
  This is the non-obvious insight that only someone who lived this problem would know.
  Make investors feel they're being let in on a secret.

S07 [VISION — INTRODUCING US]: Introduce the product/service. Dead simple. One sentence.
  "We built X. It does Y. In Z minutes." Then show the magic.
  bigStat = your headline metric (fastest/cheapest/most loved).

S08 [CARDS — HOW IT WORKS]: 3 steps. Each bullet = bold label + full paragraph.
  Format: "Step 1 — [Action title]: [What the customer does]. [What happens next]. [The specific outcome they get, with a number if possible]."
  Each bullet 40-60 words. Make the simplicity feel magical.

S09 [SPLITR — TRACTION]: Your strongest proof points. Real numbers if available.
  If pre-revenue, use leading indicators: waitlist, beta users, LOIs, pilot agreements.
  bigStat = your SINGLE most impressive number (MRR, DAU, orders, NPS, etc.)

S10 [SPLITL — CUSTOMER LOVE]: Retention, NPS, repeat rate, testimonial data.
  "73% reorder within 60 days. Industry average: 31%." Show love, not just usage.
  bigStat = your retention or NPS or repeat rate number.

S11 [SPLITR — MARKET]: TAM/SAM/SOM. Use specific India ₹ numbers from the intel above.
  3 bullets = TAM context, SAM you can realistically reach, SOM in 36 months.
  bigStat = your TAM number.

S12 [CARDS — INDIA TAILWINDS]: 3 specific macro tailwinds from the sector intelligence.
  Each = one external force making you inevitable. Name specific government policies,
  infrastructure shifts, or demographic changes.

S13 [SPLITR — UNIT ECONOMICS]: CAC, LTV, gross margin, payback period.
  Use the benchmark data to contextualize. Show you're better than industry benchmark.
  bigStat = LTV:CAC ratio OR gross margin %.

S14 [SPLITL — THE MOAT]: Why are you impossible to copy in 18 months?
  Use the moat patterns from the intel. Be specific about data advantages,
  network effects, switching costs, or regulatory moats.

S15 [SPLITR — WHY WE WIN]: Direct named competitor comparison. 3 bullets.
  Each = "[Competitor] does X. We do Y. The difference: [specific outcome/metric]."
  bigStat = your key differentiator expressed as a number.

S16 [CARDS — ROADMAP]: 3 phases across 18 months. What THIS funding unlocks.
  Phase 1 (0-6 months): what you build/prove
  Phase 2 (6-12 months): what you scale
  Phase 3 (12-18 months): Series A milestone you'll hit

S17 [VISION — 5-YEAR VISION]: What does India look like in 2030 because of you?
  Bold. 100x thinking. One headline + 3 expansion vectors.
  bigStat = your 2030 target metric.

S18 [SPLITL — THE TEAM]: Why this team and ONLY this team can win this.
  "[Name] built X at Y company, achieving Z in 18 months." Specific, not generic.

S19 [ASK — THE ASK]: Exact amount. 3 use buckets with % allocation.
  Clear milestone: "By Month 18, we'll have X, Y, Z — triggering Series A."
  bigStat = the exact funding ask.

S20 [CLOSER — THE CLOSER]: ONE sentence that contains the essence of your entire thesis.
  Poetic. Human. Bold. Should make someone want to screenshot it.
  subtitle = your call to action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON — no markdown, no preamble, no explanation. Must be complete and parseable.

{
  "deckTitle": "Full deck title — your best claim in under 10 words",
  "companyTagline": "One-line company description that makes someone stop scrolling",
  "executiveSummary": "3 sentences written like a WhatsApp message a Sequoia partner sends their associate: 'You need to see this. [Company] is doing X in Y market. They already have Z and the team is exceptional.'",
  "whyNow": "The single macro shift that makes this company inevitable in the next 24 months",
  "competitiveAdvantage": "The one unfair advantage that cannot be replicated in 2 years",
  "slides": [
    {
      "slideNumber": 1,
      "act": "ACT 1 - THE WORLD TODAY",
      "title": "Claim-based title — max 10 words, never a label",
      "subtitle": "Sharp supporting line — human truth or key data point, max 15 words",
      "bullets": [
        "Bold Label: Full sentence with specific number or named fact. Second sentence explaining why this matters or what it means. Optional third sentence with concrete implication or comparison. (40-60 words total per bullet)",
        "Bold Label: Full sentence with specific number or named fact. Second sentence explaining why this matters or what it means. Optional third sentence with concrete implication or comparison. (40-60 words total per bullet)",
        "Bold Label: Full sentence with specific number or named fact. Second sentence explaining why this matters or what it means. Optional third sentence with concrete implication or comparison. (40-60 words total per bullet)"
      ],
      "bigStat": "The dramatic number — e.g. ₹8L Cr / 350M / 73% / 10 min",
      "bigStatLabel": "4-8 word label giving context to bigStat",
      "speakerNote": "The one sentence a VC repeats to their partners — quotable, surprising",
      "slideStory": "One sentence: emotional state investor should feel after this slide"
    }
  ],
  "onePager": {
    "headline": "Bold company claim — the deck title in 8 words",
    "subheadline": "One supporting line",
    "problemStatement": "2 sharp sentences with numbers",
    "solutionStatement": "2 sentences — what it is and exactly why it works",
    "marketOpportunity": "TAM/SAM/SOM with specific India ₹ numbers",
    "tractionHighlights": "Top 3 proof points, comma-separated",
    "teamStatement": "Why this team wins — specific credentials in 2 sentences",
    "theAsk": "Exact amount + what it unlocks + when Series A happens",
    "contactLine": "contact@${formData.startupName?.toLowerCase().replace(/\\s+/g,'')}.com"
  }
}

Write every word as if a ₹10 Crore check depends on it. Be bold, specific, and deeply human.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 12000,
    messages: [{ role: "user", content: prompt }],
  });

  const text  = response.content[0].text;
  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Claude did not return valid JSON");
  return JSON.parse(clean.slice(start, end + 1));
}

module.exports = { generateDeckContent };
