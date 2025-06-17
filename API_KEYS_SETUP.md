# API Keys Setup Guide for SignalBoard

## 🔐 Security First

**IMPORTANT**: Never commit API keys to version control. This guide shows how to securely store API keys in Supabase.

## Quick Setup

1. **Install dependencies**:
   ```bash
   cd scripts
   npm install
   ```

2. **Add Supabase service role key to scripts/.env**:
   ```bash
   cp scripts/.env.example scripts/.env
   # Edit .env and add your service role key
   ```

3. **Run the setup script**:
   ```bash
   npm run setup:keys
   ```

4. **Verify keys are stored**:
   ```bash
   npm run verify:keys
   ```

## API Keys Required

### 1. Polygon.io (Required for Earnings Data) ✅
- **Purpose**: Real-time and historical earnings data
- **Pricing**: $29/month for Stocks Developer plan
- **Rate Limit**: 5 requests/minute
- **Get it here**: https://polygon.io/dashboard/api-keys

### 2. FDA OpenFDA API (Required for FDA Events) ✅
- **Purpose**: Drug adverse events and approval data
- **Pricing**: FREE with API key
- **Rate Limit**: 1000 requests/day (vs 240/day without key)
- **Get it here**: https://open.fda.gov/apis/authentication/

**⚠️ Important FDA API Limitations**:
- **Data Delay**: FDA data may be 2-3 months behind current date
- **Date Format**: Returns dates in YYYYMMDD format (not ISO)
- **404 Errors**: Recent date ranges often return 404 - implement fallback logic
- **Best Practice**: Try 30-day range → 90-day range → most recent available

### 3. SEC-API.io (Required for SEC Filings) ✅
- **Purpose**: Real-time SEC filing notifications
- **Pricing**: Starting at $49/month
- **Rate Limit**: 100 requests/minute
- **Get it here**: https://sec-api.io/

### 4. Alpha Vantage (Optional)
- **Purpose**: Backup earnings data source
- **Pricing**: Free tier available (5 req/min)
- **Get it here**: https://www.alphavantage.co/support/#api-key

### 5. OpenAI (Optional, for Phase 2)
- **Purpose**: Generate embeddings for similarity search
- **Pricing**: $0.0001 per 1K tokens
- **Get it here**: https://platform.openai.com/api-keys

## Manual Setup (Alternative)

If you prefer to add keys manually via SQL:

```sql
-- Connect to Supabase SQL Editor
INSERT INTO api_keys (service_name, api_key, rate_limit, rate_window)
VALUES 
  ('polygon', 'your_polygon_key_here', 5, 'minute'),
  ('alpha_vantage', 'your_av_key_here', 5, 'minute'),
  ('openai', 'your_openai_key_here', 60, 'minute')
ON CONFLICT (service_name) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  updated_at = NOW();
```

## Edge Function Environment

For Edge Functions to access the keys, they use the service role key which has access to the api_keys table. This is automatically configured when you deploy functions.

## Testing Your Setup

1. **Test Polygon.io integration**:
   ```bash
   # From the frontend UI, click "Run Polygon Scraper"
   # Check Supabase logs for success
   ```

2. **Check Edge Function logs**:
   ```bash
   supabase functions logs scrape-polygon-earnings
   ```

## Troubleshooting

### "API key not found" error
- Ensure you've run `npm run setup:keys`
- Verify with `npm run verify:keys`
- Check that service role key is correct

### Rate limit errors
- Polygon.io has strict rate limits on developer plan
- Consider upgrading for production use
- Implement caching to reduce API calls

### Edge Function deployment issues
```bash
# Redeploy with fresh environment
supabase functions deploy scrape-polygon-earnings --no-verify-jwt
```

## Security Best Practices

1. **Rotate keys regularly** - Every 90 days minimum
2. **Use different keys for dev/prod** - Never share keys between environments
3. **Monitor usage** - Set up alerts for unusual API activity
4. **Limit scope** - Only request necessary permissions

## Next Steps

After setting up API keys:

1. Deploy all Edge Functions
2. Run initial data scrapers
3. Set up cron jobs for automated scraping
4. Monitor performance and adjust rate limits

Remember: The Polygon.io key you provided will enable real earnings data. Make sure to monitor your usage to stay within rate limits!