#!/bin/bash

echo "🚀 SignalBoard API Key Setup"
echo "=========================="
echo ""
echo "This script will help you securely store your API keys in Supabase."
echo "The keys will be encrypted at rest and only accessible via service role."
echo ""
echo "We'll set up the following API keys:"
echo "1. Polygon.io - For earnings data"
echo "2. FDA OpenFDA - For drug adverse events"
echo "3. SEC-API.io - For SEC filings"
echo ""
echo "Press Enter to continue..."
read

# Run the setup script
npm run setup:keys

echo ""
echo "✅ Setup complete! Your API keys are now securely stored in Supabase."
echo ""
echo "Next steps:"
echo "1. Deploy Edge Functions: cd .. && supabase functions deploy"
echo "2. Test the scrapers from the frontend UI"
echo "3. Monitor logs: supabase functions logs"