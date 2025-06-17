#!/bin/bash

# Script to create GitHub issues for SignalBoard project
# Usage: ./create-issues.sh

echo "🚀 Creating GitHub issues for SignalBoard..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it with: brew install gh"
    echo "Then authenticate with: gh auth login"
    exit 1
fi

# Create issues using GitHub CLI
echo "Creating Issue #1: Polygon.io Integration..."
gh issue create \
  --title "Replace mock earnings data with real Polygon.io API" \
  --body "Currently using hardcoded mock data in \`scrape-polygon-earnings/index.ts\`. Need to implement real API integration.

### Tasks:
- [ ] Verify Polygon.io API endpoints for earnings calendar
- [ ] Update scraper to use real API structure
- [ ] Handle pagination for large result sets
- [ ] Implement proper error handling for API failures
- [ ] Add rate limiting logic (5 req/min on developer plan)
- [ ] Test with production API key

### References:
- Current implementation: \`supabase/functions/scrape-polygon-earnings/index.ts\`
- API docs: https://polygon.io/docs/stocks/get_vx_reference_financials" \
  --label "enhancement,backend,high-priority"

echo "Creating Issue #2: Timeline UI Architecture..."
gh issue create \
  --title "Choose visualization library and implement timeline component" \
  --body "Need to decide on the best approach for the interactive catalyst timeline with glass morphism effects.

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
- Need for custom visualizations?" \
  --label "frontend,design,discussion"

echo "Creating Issue #3: ML Model Training Pipeline..."
gh issue create \
  --title "Design ML training pipeline for catalyst predictions" \
  --body "Need to design how we'll train models to predict price movements from catalysts.

### Open Questions:
- Where to source historical outcome data?
- Feature engineering beyond embeddings?
- Model architecture (XGBoost vs neural network)?
- How to handle class imbalance?
- Backtesting framework?

### Initial thoughts:
- Use \`catalyst_outcomes\` table for training data
- Features: embedding, market cap, sector, sentiment
- Start with binary classification (up/down)
- Track accuracy over time" \
  --label "ml,backend,research"

echo "Creating Issue #4: Authentication Strategy..."
gh issue create \
  --title "Implement auth system with Supabase Auth" \
  --body "Define authentication strategy and user permissions model.

### Requirements:
- Social login (Google, GitHub)
- Email/password option
- Role-based access (free vs premium)
- API key management for power users
- Session management

### Questions:
- Custom auth UI or Supabase Auth UI?
- How to handle API rate limits per user?
- Premium feature gating strategy?" \
  --label "security,frontend,backend"

echo "Creating Issue #5: Legal Compliance..."
gh issue create \
  --title "Legal review for financial data platform" \
  --body "Need legal review before public launch to ensure compliance.

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
- Consult with fintech lawyer" \
  --label "compliance,legal,blocking"

echo "Creating Issue #6: Mobile Timeline Design..."
gh issue create \
  --title "Design mobile experience for catalyst timeline" \
  --body "Timeline visualization needs mobile-specific design.

### Challenges:
- Limited screen space for timeline
- Touch interactions vs mouse
- Performance on mobile browsers
- Glass effects on low-end devices

### Proposed solutions:
- Vertical timeline for mobile
- Card-based view option
- Progressive enhancement for effects
- Native app consideration?" \
  --label "mobile,ux,design"

echo "Creating Issue #7: Scaling Architecture..."
gh issue create \
  --title "Plan for scaling real-time updates to 1000+ concurrent users" \
  --body "Current setup may not scale well with many concurrent connections.

### Considerations:
- Supabase Realtime connection limits
- WebSocket connection pooling
- Client-side throttling
- Selective updates (only relevant catalysts)
- Caching strategy

### Research needed:
- Supabase Realtime benchmarks
- Alternative solutions (Pusher, Ably)
- Cost implications" \
  --label "infrastructure,performance,architecture"

echo "Creating Issue #8: Historical Data Backfill..."
gh issue create \
  --title "Source and import historical catalyst outcomes for ML training" \
  --body "Need historical data to train prediction models.

### Data sources to investigate:
- Yahoo Finance API
- Alpha Vantage
- Polygon.io historical
- Manual annotation?

### Requirements:
- 2+ years of historical data
- Price movements after catalysts
- Sector/market context
- Quality validation" \
  --label "data,ml,backend"

echo "Creating Issue #9: Deployment Strategy..."
gh issue create \
  --title "Define deployment pipeline and monitoring" \
  --body "Need production deployment strategy.

### Decisions needed:
- Hosting: Vercel vs AWS vs self-hosted?
- CI/CD pipeline (GitHub Actions?)
- Monitoring: Sentry, DataDog, or?
- Log aggregation
- Backup strategy
- Staging environment" \
  --label "devops,infrastructure"

echo "Creating Issue #10: Design System..."
gh issue create \
  --title "Create glass morphism design system" \
  --body "Need consistent design language across the app.

### Tasks:
- [ ] Define color palette
- [ ] Glass effect standards
- [ ] Typography scale
- [ ] Spacing system
- [ ] Component library (Storybook?)
- [ ] Dark/light mode support
- [ ] Accessibility guidelines" \
  --label "design,frontend"

echo "✅ All issues created successfully!"
echo "View them at: https://github.com/andeslee444/SignalBoard/issues"