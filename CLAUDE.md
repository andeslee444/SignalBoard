# CLAUDE.md - SignalBoard Project

This file provides guidance to Claude Code (claude.ai/code) when working with the SignalBoard codebase.

## Project Overview

SignalBoard is a futuristic, event-driven trading platform that helps traders anticipate and act on stock price catalysts through:
- Visual catalyst timeline with predictive analytics
- Personalized portfolio integration
- Gamified forecasting experience
- Glass UI design system

**Project Status**: Active development - MVP Phase 1 (Weeks 1-12)

## Relationship to PRD

This CLAUDE.md file complements the SignalBoard_prd.md by providing:
- **PRD**: WHAT we're building and WHY (product vision, features, business requirements)
- **CLAUDE.md**: HOW we're building it (implementation details, code patterns, technical decisions)

## Code Quality Rules

**Golden Rule**: Write the code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.

**Principle**: Do not take shortcuts if there could be problems in the future, act as a L11 Google Fellow would.

### Specific Guidelines
- **No premature optimization**: Get it working first, optimize based on real metrics
- **Explicit over implicit**: Clear variable names, no magic numbers
- **Error handling**: Every external API call must have proper error handling
- **Testing**: Write tests for critical paths (ML predictions, financial calculations)
- **Documentation**: Complex algorithms need inline explanations

## Project Structure

```
SignalBoard/
├── supabase/
│   ├── functions/        # Edge Functions for data processing
│   │   ├── scrape-fda/   # FDA adverse events scraper
│   │   ├── scrape-sec/   # SEC filings scraper
│   │   ├── scrape-earnings/ # Earnings calendar scraper
│   │   ├── process-embeddings/ # OpenAI embeddings
│   │   └── predict-catalyst/ # ML predictions
│   └── migrations/       # Database schema migrations
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   │   ├── auth/     # Authentication UI
│   │   │   ├── catalyst/ # Catalyst features
│   │   │   ├── Timeline/ # Timeline visualization
│   │   │   └── ui/       # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Frontend utilities
│   └── public/           # Static assets
├── scripts/              # Setup and utility scripts
└── docs/                 # Project documentation
```

## Technical Implementation Details

### Supabase MVP Architecture
**IMPORTANT**: For the MVP, we're using Supabase as our complete backend solution. See **SUPABASE_IMPLEMENTATION.md** for detailed setup and code examples.

### Performance Requirements (from PRD)
- **SLA**: 30 seconds to 2 minutes for high-impact catalysts
- **Data Volume**: ~500MB/day structured, 2-5GB/day unstructured
- **Concurrent Users**: MVP 100-500 DAU, scaling to 5K+ DAU

### Data Pipeline Implementation (Supabase)
```typescript
// Edge Function for catalyst processing
import { SupabaseClient } from '@supabase/supabase-js'

enum CatalystPriority {
  FDA_APPROVAL = 1,
  EARNINGS = 2,
  FED_RATES = 3,
  OTHER = 4
}

// Real-time processing via Supabase
export async function processCatalyst(
  supabase: SupabaseClient,
  catalyst: Catalyst
) {
  // Insert with priority scoring
  const { data, error } = await supabase
    .from('catalysts')
    .insert({
      ...catalyst,
      impact_score: calculateImpactScore(catalyst),
      confidence_score: await getMLConfidence(catalyst)
    })
  
  // Trigger real-time update to all subscribers
  await supabase.channel('catalysts').send({
    type: 'broadcast',
    event: 'new_catalyst',
    payload: data
  })
}
```

### ML Model Implementation
```python
# Feature engineering pipeline
features = [
    "catalyst_type",
    "historical_volatility_30d",
    "sentiment_delta_24h",
    "debt_to_equity",
    "sector_momentum",
    "macro_rate_environment"
]

# Model accuracy tracking
MINIMUM_ACCURACY = 0.65  # 65% for binary classification
CONFIDENCE_BAND = 0.70   # 70% for range prediction
```

### Frontend Performance Patterns
```typescript
// Virtualize timeline for >100 nodes
import { VirtualList } from '@tanstack/react-virtual';

// Throttle chart updates
const throttledUpdate = useMemo(
  () => throttle(updateChart, 100),
  [updateChart]
);

// Glass UI with performance consideration
const glassStyle = {
  backdropFilter: 'blur(10px)', // Use sparingly
  WebkitBackdropFilter: 'blur(10px)',
  background: 'rgba(0, 0, 0, 0.5)',
};
```

## Security Implementation

### API Security
```python
# Read-only broker access
BROKER_PERMISSIONS = ["accounts:read", "positions:read"]
# NEVER include: ["orders:write", "trades:execute"]

# Rate limiting
from fastapi_limiter import FastAPILimiter
@app.on_event("startup")
async def startup():
    redis = await aioredis.create_redis_pool("redis://localhost")
    await FastAPILimiter.init(redis)
```

### Compliance Implementation
```typescript
// Disclaimer component
const DisclaimerBanner = () => (
  <Alert className="mb-4">
    <AlertDescription>
      For educational purposes only. Not financial advice.
    </AlertDescription>
  </Alert>
);

// Add to all prediction components
<PredictionGame>
  <DisclaimerBanner />
  {/* game content */}
</PredictionGame>
```

## Development Workflow

### Development Phases

**✅ Completed Phases (Weeks 1-10)**:
- Weeks 1-2: Supabase Setup & Data Pipeline
- Weeks 3-4: Timeline UI with Glass Morphism
- Weeks 5-6: ML Integration with XGBoost
- Weeks 7-8: Authentication & Security
- Weeks 9-10: Code Quality & Standards

**🚧 Current Phase (Week 11-12)**: Testing & Documentation
```bash
# Run tests
npm test
npm run test:coverage

# Lint code
npm run lint

# Build for production
npm run build
```

**📅 Upcoming Phases**:
- Production deployment preparation
- Performance optimization
- User onboarding flow

## Testing Requirements

### Unit Tests (Minimum Coverage: 80%)
```python
# backend/tests/test_catalyst_predictor.py
def test_prediction_accuracy():
    model = load_model("catalyst_predictor_v1")
    test_data = load_historical_catalysts("2020-2023")
    accuracy = model.evaluate(test_data)
    assert accuracy >= 0.65  # Minimum threshold
```

### Integration Tests
```typescript
// frontend/tests/timeline.test.tsx
test('timeline handles 1000+ catalysts efficiently', async () => {
  const catalysts = generateMockCatalysts(1000);
  const { getByTestId } = render(<Timeline catalysts={catalysts} />);
  expect(performance.now() - startTime).toBeLessThan(100);
});
```

## Error Handling Patterns

### Data Source Failures
```python
# Always have fallback sources
async def get_fda_data():
    try:
        return await fda_api.get_approvals()
    except APIError:
        logger.warning("FDA API failed, trying backup")
        try:
            return await fda_backup_scraper.get_approvals()
        except:
            # Return cached data with warning
            cached = await redis.get("fda_approvals_cache")
            return {
                "data": cached,
                "warning": "Using cached data from " + cached["timestamp"]
            }
```

### Frontend Error Boundaries
```typescript
// Wrap high-risk components
<ErrorBoundary fallback={<CatalystTimelineFallback />}>
  <CatalystTimeline />
</ErrorBoundary>
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance metrics meet SLA (<2 min catalyst processing)
- [ ] Security scan completed (no exposed credentials)
- [ ] Compliance disclaimers visible on all pages
- [ ] Error monitoring configured (Sentry)

### Post-deployment
- [ ] Monitor CloudWatch for scraper failures
- [ ] Check Redis cache hit rates (target >80%)
- [ ] Verify ML model accuracy daily
- [ ] Review user feedback for UX issues

## Common Commands

```bash
# Development
make dev              # Start all services locally
make test            # Run all tests
make lint            # Check code quality

# Monitoring
make logs            # Tail all service logs
make metrics         # View performance dashboard
make alerts          # Check active alerts

# Data Pipeline
make scrape-fda      # Manual FDA scrape
make scrape-sec      # Manual SEC scrape
make ml-retrain      # Retrain ML models
```

## Debugging Tips

### Check Data Pipeline Health
```bash
# Redis queue status
redis-cli llen catalyst_queue

# Scraper status
curl http://localhost:8000/api/scrapers/status

# ML model metrics
python -m ml.evaluate --model latest
```

### Frontend Performance
```javascript
// Enable React DevTools Profiler
if (process.env.NODE_ENV === 'development') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = true;
}

// Log Zustand state changes
const useStore = create(
  devtools((set) => ({
    // store implementation
  }))
);
```

## When to Consult PRD vs CLAUDE.md

**Check PRD for**:
- Feature requirements and scope
- Success metrics and KPIs
- Business logic and rules
- Compliance requirements
- Timeline and priorities

**Check CLAUDE.md for**:
- Implementation patterns
- Code examples
- Technical decisions
- Performance optimizations
- Debugging approaches

## MCP Tools for SignalBoard Development

### Frontend Development
```bash
# Install glass UI components
mcp__shadcn-ui__install-component --component card
mcp__shadcn-ui__install-component --component chart
mcp__shadcn-ui__install-component --component dialog

# Generate custom components
mcp___21st-dev_magic__21st_magic_component_builder \
  --searchQuery "stock timeline visualization" \
  --message "Create a glass morphism catalyst timeline node"
```

### Data Pipeline Development with Supabase
```typescript
// Use Supabase MCP tools for database operations
await mcp__supabase__execute_sql({
  project_id: "yjaxznsrysvazxqtvcvm",
  query: `
    INSERT INTO catalysts (type, ticker, title, event_date)
    VALUES ('fda', 'MRNA', 'FDA Approval Decision', '2024-02-15')
  `
})

// Deploy Edge Functions via MCP
await mcp__supabase__deploy_edge_function({
  project_id: "yjaxznsrysvazxqtvcvm",
  name: "process-catalyst",
  files: [{
    name: "index.ts",
    content: catalystProcessorCode
  }]
})

// Use MCP fetch within Edge Functions for external APIs
const fdaData = await mcp__fetch__fetch({
  url: "https://api.fda.gov/drug/event.json",
  maxLength: 50000
})
```

### Testing with MCP Tools
```javascript
// Performance testing
await mcp__browser-tools__runPerformanceAudit();

// Visual regression
await mcp__puppeteer__puppeteer_screenshot({
    name: "catalyst-timeline",
    selector: ".timeline-container"
});

// Network monitoring
const logs = await mcp__browser-tools__getNetworkLogs();
const apiCalls = logs.filter(log => log.url.includes('/api/catalysts'));
```

### Error Monitoring Setup
```python
# Initialize Sentry monitoring
mcp__Sentry__create_project(
    organizationSlug="signalboard",
    teamSlug="engineering",
    name="signalboard-prod",
    platform="python"
)

# Set up alerts for SLA violations
mcp__Sentry__update_issue(
    issueId="CATALYST-DELAY",
    status="resolved",
    assignedTo="oncall"
)
```

### Recommended MCP Workflow

1. **Start with Supabase** for MVP backend (faster delivery)
2. **Use shadcn-ui** for consistent glass UI components
3. **Implement browser-tools** testing from day 1
4. **Set up Sentry** before first deployment
5. **Use fetch MCP** for initial scrapers (migrate to custom later)

## Task Tracking

**Current tasks and improvements are tracked in TODO.md**. Check this file for:
- Current development phase status
- High priority improvements
- Known issues and bugs
- Future feature ideas

## Questions or Issues?

1. **Performance degradation**: Check CloudWatch metrics first
2. **Data quality issues**: Verify scraper status and fallback sources
3. **ML accuracy drop**: Review recent training data for anomalies
4. **User complaints**: Check Sentry for unreported errors

Remember: 
- The PRD defines the destination (WHAT to build)
- CLAUDE.md provides the map (HOW to build it)
- TODO.md tracks the journey (current progress and tasks)