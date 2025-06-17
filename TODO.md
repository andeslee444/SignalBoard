# SignalBoard TODO List

## 🚀 Current Phase: MVP Week 3-4 (Timeline UI)

### ✅ Completed (Phase 1: Backend Infrastructure)
- [x] Supabase database schema setup
- [x] API keys securely stored
- [x] Edge Functions deployed (FDA, SEC, Polygon, Embeddings)
- [x] FDA scraper date handling fixed
- [x] Unique constraints added for upserts
- [x] OpenAI embeddings integrated
- [x] Similarity search function created

### 🔄 In Progress (Phase 2: Timeline UI)
- [ ] Create React frontend structure
- [ ] Implement catalyst timeline visualization
- [ ] Add glass morphism UI design
- [ ] Integrate real-time updates from Supabase
- [ ] Build catalyst detail panel

### 📋 High Priority Improvements

#### Data Pipeline Enhancements
- [ ] **Implement real Polygon.io API integration** - Currently using mock data
- [ ] **Add more drug mappings** - Current table only has 10 drugs
- [ ] **Create FDA data freshness monitor** - Alert when FDA data is >90 days old
- [ ] **Implement rate limiting for API calls** - Prevent hitting API limits
- [ ] **Add retry logic with exponential backoff** - Handle transient API failures

#### Performance Optimizations
- [ ] **Implement caching layer** - Redis or Supabase cache for frequently accessed data
- [ ] **Batch embedding generation** - Process in chunks of 50 to avoid timeouts
- [ ] **Add pagination to catalyst queries** - Don't load all catalysts at once
- [ ] **Optimize similarity search** - Add HNSW index for better performance

#### Monitoring & Reliability
- [ ] **Set up error tracking** - Sentry integration for Edge Functions
- [ ] **Add health check endpoints** - Monitor scraper status
- [ ] **Create data quality dashboard** - Track scraper success rates
- [ ] **Implement dead letter queue** - For failed catalyst processing

#### Security Enhancements
- [ ] **Add API key rotation mechanism** - Automated key rotation every 90 days
- [ ] **Implement request signing** - For Edge Function authentication
- [ ] **Add rate limiting per user** - Prevent abuse of prediction API

### 📅 Future Phases (from PRD)

#### Week 5-6: ML Integration
- [ ] Implement prediction model training pipeline
- [ ] Create historical outcome tracking
- [ ] Build confidence scoring algorithm
- [ ] Add model performance monitoring

#### Week 7-8: Prediction Game
- [ ] Design gamification mechanics
- [ ] Implement prediction submission flow
- [ ] Create scoring algorithm
- [ ] Build user achievement system

#### Week 9-10: Portfolio Integration
- [ ] CSV import functionality
- [ ] Portfolio holdings parser
- [ ] Personalized alert system
- [ ] Risk exposure analysis

### 🐛 Known Issues
- [ ] **FDA scraper date range** - Hardcoded fallback ranges need dynamic adjustment
- [ ] **Embedding regeneration** - No way to force regenerate embeddings for updated catalysts
- [ ] **Duplicate catalyst detection** - Need better deduplication logic beyond ticker+date
- [ ] **Time zone handling** - Ensure consistent timezone usage across all data sources

### 💡 Feature Ideas (Post-MVP)
- [ ] **Multi-language support** - Translate catalyst summaries
- [ ] **Mobile app** - React Native or Flutter
- [ ] **Browser extension** - Quick catalyst checks while browsing
- [ ] **Slack/Discord integration** - Alert notifications
- [ ] **Export functionality** - CSV/JSON export of predictions

### 📚 Documentation Tasks
- [ ] **Create API documentation** - Document all Edge Function endpoints
- [ ] **Add architecture diagram** - Visual representation of data flow
- [ ] **Write deployment guide** - Step-by-step production deployment
- [ ] **Create troubleshooting guide** - Common issues and solutions

### 🧪 Testing Requirements
- [ ] **Unit tests for Edge Functions** - Minimum 80% coverage
- [ ] **Integration tests for data pipeline** - End-to-end scraper tests
- [ ] **Load testing** - Ensure system handles 500 concurrent users
- [ ] **UI/UX testing** - Timeline performance with 1000+ catalysts

## 📝 Notes

- Remember to run linting before commits: `npm run lint`
- Test Edge Functions locally before deploying
- Monitor Supabase usage to avoid cost overruns
- Keep PRD requirements in mind for all implementations

Last Updated: 2025-06-17