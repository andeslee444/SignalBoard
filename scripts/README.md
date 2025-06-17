# SignalBoard Test Scripts

This directory contains utility scripts for testing and debugging SignalBoard's data pipeline.

## Available Scripts

### `test-fda-api.ts`
Tests FDA API connectivity and response formats with different query parameters.
```bash
npx tsx test-fda-api.ts
```

### `test-fda-dates.ts`
Discovers the latest available FDA data by checking different date ranges.
```bash
npx tsx test-fda-dates.ts
```

### `test-similarity.ts`
Tests the vector similarity search functionality using pgvector embeddings.
```bash
npx tsx test-similarity.ts
```

### `setup-api-keys.ts`
Interactive script to securely store API keys in Supabase.
```bash
npm run setup:keys
```

### `verify-api-keys.ts`
Verifies that all required API keys are properly stored.
```bash
npm run verify:keys
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Add your Supabase service role key to `.env`

## Common Issues

- **"Transform failed" errors**: Make sure you're using `npx tsx` instead of `node`
- **"Invalid JWT" errors**: Use the service role key, not the anon key
- **Rate limit errors**: Check API usage and implement delays between requests

## Adding New Scripts

When adding new test scripts:
1. Use TypeScript for better type safety
2. Include error handling and helpful error messages
3. Add documentation in this README
4. Consider adding to package.json scripts if frequently used