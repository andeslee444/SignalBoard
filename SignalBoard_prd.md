
# 📄 Product Requirements Document (PRD)

### **Product Name:**  
**SignalBoard - Stock AI Catalyst Analyzer**

### **Prepared For:**  
Full-stack engineers and UI/UX designers building the MVP and alpha prototype

### **Related Documents:**
- **CLAUDE.md** - Development guidelines and implementation details for this project
- For technical implementation specifics, refer to CLAUDE.md in this directory

---

## 🎯 Product Vision

A futuristic, visually stunning event-driven trading platform that helps retail and professional traders anticipate, understand, and act on stock price catalysts. The platform integrates predictive analytics, a personalized portfolio engine, and a gamified forecasting experience—all wrapped in a sleek glass UI.

---

## 🧩 Core Features

### **1. Catalyst Timeline Visualization**

**Description:**  
An immersive, scrollable horizontal timeline showing upcoming stock catalysts as glowing nodes.

**Functional Requirements:**
- Horizontal scrolling timeline (zoomable: daily → weekly → monthly)
- Each **catalyst node** contains:
  - Event title (e.g., "XYZ Pharma FDA Approval")
  - Date/time
  - Impact probability/confidence meter (visual glow intensity or gradient)
- Nodes animate on hover and expand on click

**On Click:**
- Opens **Catalyst Detail Panel** (see below)
- Triggers update to stock chart and prediction engine

---

### **2. Catalyst Detail Panel**

**Description:**  
Dynamic right-hand panel with detailed insights when a catalyst is selected.

**Functional Requirements:**
- Jargon-free event summary
- Confidence score (bar or star rating)
- Timeline of historical similar catalysts:
  - 3 examples with ability to generate more
- Price impact graph overlays showing:
  - Historical price before/after similar events
  - Average return window (e.g., +18% over 3 days)
- Context Summary (and how catalyst is affect by it):
  - Macro (rate cycle, inflation, etc.)
  - Industry (competitive landscape)
  - Company fundamentals (debt, runway, sentiment)
- Buttons:
  - “Set Alert”
  - “Add to Watchlist”
  - “Launch Prediction Game”

---

### **3. Portfolio Integration & Alerts**

**Description:**  
Auto-detects stocks the user holds and prioritizes catalyst tracking accordingly.

**Functional Requirements:**
- Secure integration with:
  - Robinhood
  - Public.com
  - Interactive Brokers
  - Custom CSV import fallback
- Detects tickers in portfolio and prioritizes:
  - Catalyst notifications
  - Suggested predictions
  - Personalized alerts
- Alerting System:
  - Push/email/SMS
  - Alert customization (event type, impact score, time range)

---

### **4. Predictive Game Experience**

**Description:**  
Engages users in predicting stock price movement post-catalyst, rewarding accuracy.

**Functional Requirements:**
- Prediction Input:
  - Select catalyst
  - Drag neon slider on price chart to set:
    - Expected price
    - Timeframe (1D / 3D / 7D / custom)
  - Confirm button with clear success criteria:
    - ±5% = success
    - ±2% = bonus
- Result Visualization:
  - Post-event comparison: "Your Prediction vs Actual"
  - Accuracy meter
- Points System:
  - Accuracy rewards based on event volatility and rarity
  - Bonus for hitting high-difficulty predictions
- Leaderboards:
  - Global, friends, and industry-specific
  - Badge system:
    - “Biotech Guru”
    - “Macro Wizard”
    - “Perfect Call”
- Share Feature:
  - Social share buttons with visual badges and predictions

---

## 🖼 UI/UX System

### Theme & Aesthetic
- **Dark Mode Only** for immersive experience
- **Neon-glass floating panels** on black canvas
- Smooth transitions & depth via shadows, glows, and parallax scrolling

### Fonts & Colors
- **Font**: Inter / Montserrat / Roboto (clean sans-serif)
- **Base**: Charcoal black `#0b0c10`
- **Accent Neon**: Cyan `#00ffff`, Magenta `#ff00ff`, Electric blue `#007bff`
- **Glow**: Subtle shadows for hover and transition feedback

### Component Highlights:
- Floating top bar (logo, search, profile, notifications)
- Left vertical menu: Icons with tooltips for:
  - Home
  - Timeline
  - Portfolio
  - Game
- Glass cards for catalyst detail and prediction input
- Drag-and-drop markers for price predictions
- Floating “+” buttons for adding new tickers, alerts

---

## 🔐 Technical Architecture Overview

For detailed technical stack and implementation patterns, see **CLAUDE.md** in this directory.

### MVP Architecture Decision: Supabase Backend
For the MVP, we're using **Supabase** as our complete backend solution to accelerate development:
- **Real-time subscriptions** for catalyst updates
- **Built-in authentication** for portfolio connections
- **Edge Functions** for API processing and ML inference
- **PostgreSQL database** with Row Level Security
- **Vector embeddings** for similarity search
- **Storage** for historical data and caching

### Key Performance Requirements
- **SLA**: 30 seconds to 2 minutes for high-impact catalysts
- **Data Volume**: ~500MB/day structured, 2-5GB/day unstructured
- **Concurrent Users**: MVP 100-500 DAU, scaling to 5K+ DAU
- **ML Accuracy**: >65% binary classification, 70% range prediction

### Architecture Principles
- **Serverless-first** with Supabase Edge Functions
- **Real-time** updates via Supabase subscriptions
- **Security-first** with Row Level Security policies
- **Rapid iteration** using Supabase's built-in features

---

## 📊 Data Sources & Pipeline Strategy

### MVP Priority Sources (High ROI, Low Cost)
1. **FDA API** (drug trials, approvals) - FREE
2. **EDGAR/SEC** (earnings, insider trading) - FREE
3. **Macro data**: BLS, BEA, FRED - FREE
4. **Fed & ECB** rate decisions - FREE

### Phase 2 Sources
- **X/Twitter API**: $100/month dev tier
- **Alpha Vantage/Polygon.io**: Price data
- **Consumer surveys**: University of Michigan, Gallup
- **Product launches**: Company event calendars

### Future Consideration (Post-validation)
- **FactSet/Pitchbook**: $50K budget earmarked if demand validates
- **Patent office filings**
- **Conference calendars** (e.g., ASCO for biotech)

### Data Pipeline Specifications
- **Historical Backfill**:
  - 5 years for earnings data
  - 10 years for FDA/biotech events
- **Storage**: S3 with Parquet format for efficient querying
- **Caching**: Redis with aggressive caching strategy
- **Pre-filtering**: NLP models to reduce storage needs

---

## 🔒 Compliance & Risk Management

### Financial Regulations
- **Positioning**: Educational platform only - "Not financial advice"
- **Disclaimers**: 
  - Modal on first visit
  - Inline tooltips on predictions
  - Clear "informational purposes only" labels
- **Future licensing**: Series 65 partners only if monetizing signals

### Data Privacy (GDPR/CCPA)
- **Encryption**: AES-256 at rest, TLS in transit
- **User rights**: 
  - Consent collection for portfolio data
  - Right-to-delete API endpoint
  - Audit trails via Vanta (post-launch)

### Market Manipulation Prevention
- No direct text-based prediction sharing
- No per-ticker forums
- Automated anomaly detection for coordinated behavior
- Focus leaderboards on accuracy, not outcomes

### Brokerage Security
- **Read-only access only** - never request trade permissions
- **OAuth2 implementation** per broker
- **Fallback**: CSV upload for MVP
- **Error handling**: Fail-silent UX with status badges

---

## 📈 ML Model Specifications

### Feature Engineering
1. **Catalyst metadata**: type, industry, issuer
2. **Historical volatility**: pre-event price trends
3. **Social sentiment**: delta measurements
4. **Company fundamentals**: debt, runway, sentiment
5. **Macro context**: rate environment, sector momentum

### Model Performance Targets
- **Binary classification** (↑/↓): >65% accuracy
- **Range prediction** (±%): 70% within confidence band
- **Retraining**: Weekly scheduled with sliding window validation

### Quality Control
- **AI Summaries**: 
  - GPT-4 with constrained prompts
  - Template-based post-processing
  - Random sampling for manual review
  - User flagging system for hallucinations

---

## 🚀 MVP Scope & Phasing

### Phase 1 MVP (Launch Ready)
✅ **Core Features**:
- Catalyst Timeline (earnings + FDA only)
- Catalyst Detail Panel
- Basic prediction game (no leaderboard)
- CSV portfolio import only
- Jargon-free summaries

❌ **Delayed to Phase 2**:
- Broker OAuth integrations
- Social features/sharing
- Leaderboards
- Additional catalyst types

### Success Metrics
**Engagement**:
- 30%+ weekly return rate (WUR)
- 50%+ catalyst interaction rate
- DAU/MAU > 0.25 for prediction game

**Growth Signals**:
- 10%+ "Upgrade" click rate
- 25%+ broker integration waitlist conversion

### Development Priorities
1. **Week 1-2**: Catalyst ingestion pipeline + database schema
2. **Week 3-4**: Timeline UI + detail panel
3. **Week 5-6**: ML model v1 + prediction engine
4. **Week 7-8**: Prediction game mechanics
5. **Week 9-10**: Portfolio CSV import + personalization
6. **Week 11-12**: Testing, polish, deployment

---

## 🧮 Technical Debt & Maintenance

### Scraping Resilience
- **Monitoring**: Real-time alerts for scraper failures
- **Architecture**: Microservices for isolated scraper updates
- **Fallbacks**: 2+ data sources per catalyst type minimum
- **Change detection**: Automated tests for DOM/API changes

### Alert Fatigue Prevention
- **ML Relevance Scoring**: Based on:
  - Portfolio exposure
  - Historical volatility
  - User interaction patterns
- **User Controls**:
  - Market cap filters
  - Industry preferences
  - Digest mode option (daily summary)
- **Smart defaults**: Only high-confidence, high-impact events

### Competitive Differentiation
**vs. Benzinga/Fly on Wall**:
- **Visual-first**: Immersive timeline > text feeds
- **Predictive**: ML models + gamification
- **Personalized**: Portfolio-aware prioritization
- **Retail-focused**: Jargon-free, educational positioning

**Why Build vs Partner**:
- Existing tools built for day traders/pros
- No visual timeline experiences exist
- Gamification creates unique engagement loop
- Data moat from user predictions + portfolio data
