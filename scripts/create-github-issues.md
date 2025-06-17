# GitHub Issues to Create

Copy and paste these into GitHub Issues at https://github.com/andeslee444/SignalBoard/issues/new

## Issue 1: Implement Real Polygon.io API Integration

**Title**: Replace mock earnings data with real Polygon.io API
**Labels**: enhancement, backend, high-priority
**Description**:
Currently using hardcoded mock data in `scrape-polygon-earnings/index.ts`. Need to implement real API integration.

### Tasks:
- [ ] Verify Polygon.io API endpoints for earnings calendar
- [ ] Update scraper to use real API structure
- [ ] Handle pagination for large result sets
- [ ] Implement proper error handling for API failures
- [ ] Add rate limiting logic (5 req/min on developer plan)
- [ ] Test with production API key

### References:
- Current implementation: `supabase/functions/scrape-polygon-earnings/index.ts`
- API docs: https://polygon.io/docs/stocks/get_vx_reference_financials

---

## Issue 2: Design Timeline UI Architecture

**Title**: Choose visualization library and implement timeline component
**Labels**: frontend, design, discussion
**Description**:
Need to decide on the best approach for the interactive catalyst timeline with glass morphism effects.

### Options to evaluate:
1. **D3.js** - Full control, best performance for 1000+ nodes
2. **Framer Motion + React** - Better React integration, easier animations
3. **Recharts/Visx** - Middle ground, good defaults

### Requirements:
- Virtualization for 100+ catalysts
- Smooth zoom/pan
- Glass morphism effects
- Mobile responsive
- Accessibility compliant

### Questions:
- Performance vs developer experience?
- How complex will interactions be?
- Need for custom visualizations?

---

## Issue 3: ML Model Training Pipeline

**Title**: Design ML training pipeline for catalyst predictions
**Labels**: ml, backend, research
**Description**:
Need to design how we'll train models to predict price movements from catalysts.

### Open Questions:
- Where to source historical outcome data?
- Feature engineering beyond embeddings?
- Model architecture (XGBoost vs neural network)?
- How to handle class imbalance?
- Backtesting framework?

### Initial thoughts:
- Use `catalyst_outcomes` table for training data
- Features: embedding, market cap, sector, sentiment
- Start with binary classification (up/down)
- Track accuracy over time

---

## Issue 4: Authentication & Authorization Strategy

**Title**: Implement auth system with Supabase Auth
**Labels**: security, frontend, backend
**Description**:
Define authentication strategy and user permissions model.

### Requirements:
- Social login (Google, GitHub)
- Email/password option
- Role-based access (free vs premium)
- API key management for power users
- Session management

### Questions:
- Custom auth UI or Supabase Auth UI?
- How to handle API rate limits per user?
- Premium feature gating strategy?

---

## Issue 5: Compliance & Legal Review

**Title**: Legal review for financial data platform
**Labels**: compliance, legal, blocking
**Description**:
Need legal review before public launch to ensure compliance.

### Areas to review:
- [ ] SEC data redistribution rights
- [ ] FDA data usage terms
- [ ] Investment advice disclaimers
- [ ] User-generated prediction liability
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Data retention policies

### Action items:
- Draft disclaimer text
- Research competitor approaches
- Consult with fintech lawyer

---

## Issue 6: Mobile-First Timeline Design

**Title**: Design mobile experience for catalyst timeline
**Labels**: mobile, ux, design
**Description**:
Timeline visualization needs mobile-specific design.

### Challenges:
- Limited screen space for timeline
- Touch interactions vs mouse
- Performance on mobile browsers
- Glass effects on low-end devices

### Proposed solutions:
- Vertical timeline for mobile
- Card-based view option
- Progressive enhancement for effects
- Native app consideration?

---

## Issue 7: Real-time Architecture Scaling

**Title**: Plan for scaling real-time updates to 1000+ concurrent users
**Labels**: infrastructure, performance, architecture
**Description**:
Current setup may not scale well with many concurrent connections.

### Considerations:
- Supabase Realtime connection limits
- WebSocket connection pooling
- Client-side throttling
- Selective updates (only relevant catalysts)
- Caching strategy

### Research needed:
- Supabase Realtime benchmarks
- Alternative solutions (Pusher, Ably)
- Cost implications

---

## Issue 8: Historical Data Backfill

**Title**: Source and import historical catalyst outcomes for ML training
**Labels**: data, ml, backend
**Description**:
Need historical data to train prediction models.

### Data sources to investigate:
- Yahoo Finance API
- Alpha Vantage
- Polygon.io historical
- Manual annotation?

### Requirements:
- 2+ years of historical data
- Price movements after catalysts
- Sector/market context
- Quality validation

---

## Issue 9: Deployment & DevOps Strategy

**Title**: Define deployment pipeline and monitoring
**Labels**: devops, infrastructure
**Description**:
Need production deployment strategy.

### Decisions needed:
- Hosting: Vercel vs AWS vs self-hosted?
- CI/CD pipeline (GitHub Actions?)
- Monitoring: Sentry, DataDog, or?
- Log aggregation
- Backup strategy
- Staging environment

---

## Issue 10: Design System & Component Library

**Title**: Create glass morphism design system
**Labels**: design, frontend
**Description**:
Need consistent design language across the app.

### Tasks:
- [ ] Define color palette
- [ ] Glass effect standards
- [ ] Typography scale
- [ ] Spacing system
- [ ] Component library (Storybook?)
- [ ] Dark/light mode support
- [ ] Accessibility guidelines