# DeckAI — AI Pitch Deck Generator
### Full-stack Node.js app · Anthropic Claude · Razorpay India

---

## How the architecture works

```
CLIENT (browser)                  YOUR SERVER                   EXTERNAL APIs
──────────────────                ─────────────────────         ──────────────
1. Fills form          ──POST──▶  Creates Razorpay order  ──▶  Razorpay API
2. Razorpay checkout   ◀─────────  Returns order_id               │
3. User pays UPI/card  ──────────────────────────────────────────▶│
4. Payment verified    ──POST──▶  Verifies signature       ◀──   Razorpay
5. "Generating..."     ──POST──▶  Calls Claude API         ──▶  Anthropic API
6. Downloads files     ◀─────────  Generates PPTX+DOCX+PDF

🔑 YOUR Anthropic key never leaves your server.
🔑 YOUR Razorpay secret never leaves your server.
```

---

## Step 1 — Install Node.js

Download from: https://nodejs.org (choose "LTS" version)

Verify: open Terminal / Command Prompt and run:
```
node --version     # should show v18 or higher
npm --version      # should show a number
```

---

## Step 2 — Get your project files

Put all the files in a folder called `deckai`. Structure should look like:
```
deckai/
  server.js
  package.json
  .env
  .gitignore
  routes/
    payment.js
    generate.js
  services/
    claude.js
    pptx.js
    docx.js
    pdf.js
  public/
    index.html
```

---

## Step 3 — Install dependencies

Open Terminal, go into the deckai folder, run:
```bash
cd deckai
npm install
```
This downloads all required libraries into a `node_modules` folder. Takes 1-2 minutes.

---

## Step 4 — Get your Anthropic API key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click "API Keys" in left sidebar
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-...`)

---

## Step 5 — Get your Razorpay keys

1. Go to https://dashboard.razorpay.com
2. Sign up with your business details
3. Go to Settings → API Keys
4. Click "Generate Test Key" (for testing — use Test mode first)
5. Copy both `Key ID` (starts with `rzp_test_...`) and `Key Secret`

---

## Step 6 — Add your keys to .env

Open the `.env` file in any text editor (Notepad, VS Code, etc) and fill in:
```
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-REAL-KEY-HERE
RAZORPAY_KEY_ID=rzp_test_YOUR-KEY-ID-HERE
RAZORPAY_KEY_SECRET=YOUR-SECRET-HERE
PORT=3000
PRICE_PAISE=99900
APP_URL=http://localhost:3000
```

⚠️  NEVER share this file or put it on GitHub.

---

## Step 7 — Run the server locally

```bash
npm run dev
```

You'll see:
```
╔══════════════════════════════════════╗
║   DeckAI Server running on :3000    ║
║   http://localhost:3000              ║
║   Anthropic key: ✓ loaded           ║
║   Razorpay key:  ✓ loaded           ║
╚══════════════════════════════════════╝
```

Open your browser and go to: http://localhost:3000

---

## Step 8 — Test the full flow

Use Razorpay Test mode:
- Test UPI ID: `success@razorpay`
- Test Card: `4111 1111 1111 1111`, any future date, any CVV
- Test Net Banking: select any bank, click "Success"

Fill the form → pay → watch Claude generate → download files.

---

## Step 9 — Deploy to Railway (go live for real users)

1. Go to https://railway.app — sign up free
2. Click "New Project" → "Deploy from GitHub repo"
   (First push your code to GitHub — make sure .env is in .gitignore!)
3. Once deployed, go to "Variables" tab in Railway and add all your .env values
4. Railway gives you a public URL like `https://deckai-production.up.railway.app`
5. Update APP_URL in Railway variables to this URL
6. Switch Razorpay from Test to Live mode in Razorpay dashboard
7. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your live keys

Your product is now live and taking real payments. 🚀

---

## Folder structure explained

| File | What it does |
|------|-------------|
| `server.js` | Starts the server, connects all routes |
| `.env` | Your secret keys — never commit this |
| `public/index.html` | What clients see — zero keys here |
| `routes/payment.js` | Creates Razorpay orders, verifies signatures |
| `routes/generate.js` | Calls Claude, generates and serves files |
| `services/claude.js` | Prompt to Claude API (YOUR key used here) |
| `services/pptx.js` | Builds the PowerPoint file |
| `services/docx.js` | Builds the Word document |
| `services/pdf.js` | Builds the PDF |

---

## Common issues

**`npm install` fails** → Make sure Node.js 18+ is installed

**"Anthropic key missing"** → Check your .env file, no spaces around the `=`

**Razorpay popup doesn't open** → Make sure you're using `rzp_test_` keys in test mode

**Files not downloading** → Make sure payment was verified first (check terminal logs)

**`MODULE_NOT_FOUND` error** → Run `npm install` again

---

## Pricing math

| Item | Cost |
|------|------|
| Claude API per deck | ~₹8–12 |
| Razorpay fee (2%) | ~₹20 |
| **Your cost per sale** | **~₹30** |
| **Your price** | **₹999** |
| **Your profit per deck** | **~₹969** |

At 10 decks/day → ₹9,690/day → ₹2.9L/month

---

## Need help?

- Anthropic docs: https://docs.anthropic.com
- Razorpay docs: https://razorpay.com/docs
- Railway deploy: https://docs.railway.app
