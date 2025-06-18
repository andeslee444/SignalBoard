import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function populateTestData() {
  console.log('Populating test catalyst data...')

  const testCatalysts = [
    {
      type: 'earnings',
      ticker: 'AAPL',
      title: 'Apple Inc. Q1 2025 Earnings Report',
      description: 'Quarterly earnings announcement with expected revenue of $120B',
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.85,
      confidence_score: 0.9,
      metadata: {
        company_name: 'Apple Inc.',
        market_cap: 2800000000000,
        eps_estimate: 2.1,
        report_time: 'after_close'
      }
    },
    {
      type: 'fda',
      ticker: 'MRNA',
      title: 'FDA Decision on mRNA-1283 Flu Vaccine',
      description: 'FDA approval decision for next-generation flu vaccine',
      event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.75,
      confidence_score: 0.8,
      metadata: {
        company_name: 'Moderna Inc.',
        drug_name: 'mRNA-1283',
        trial_phase: 'Phase 3',
        indication: 'Influenza'
      }
    },
    {
      type: 'fed_rates',
      ticker: 'SPY',
      title: 'Federal Reserve Interest Rate Decision',
      description: 'FOMC meeting with expected 25 basis point rate cut',
      event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.95,
      confidence_score: 0.85,
      metadata: {
        expected_change: -0.25,
        current_rate: 5.25,
        meeting_type: 'scheduled'
      }
    },
    {
      type: 'earnings',
      ticker: 'NVDA',
      title: 'NVIDIA Q4 2024 Earnings Call',
      description: 'AI chip giant reports quarterly results',
      event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.9,
      confidence_score: 0.95,
      metadata: {
        company_name: 'NVIDIA Corporation',
        market_cap: 1100000000000,
        eps_estimate: 5.2,
        report_time: 'after_close'
      }
    },
    {
      type: 'sec',
      ticker: 'TSLA',
      title: 'Tesla 10-K Annual Report Filing',
      description: 'Annual financial statements and business overview',
      event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.6,
      confidence_score: 0.95,
      metadata: {
        company_name: 'Tesla Inc.',
        filing_type: '10-K',
        fiscal_year: 2024
      }
    },
    {
      type: 'earnings',
      ticker: 'AMZN',
      title: 'Amazon Q4 2024 Earnings Release',
      description: 'E-commerce and cloud giant quarterly results',
      event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.8,
      confidence_score: 0.9,
      metadata: {
        company_name: 'Amazon.com Inc.',
        market_cap: 1500000000000,
        revenue_estimate: 170000000000,
        report_time: 'after_close'
      }
    },
    {
      type: 'fda',
      ticker: 'PFE',
      title: 'FDA Review: Pfizer RSV Vaccine for Infants',
      description: 'Regulatory decision on respiratory syncytial virus vaccine',
      event_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.7,
      confidence_score: 0.75,
      metadata: {
        company_name: 'Pfizer Inc.',
        drug_name: 'PF-06928316',
        indication: 'RSV prevention',
        target_population: 'Infants'
      }
    },
    {
      type: 'earnings',
      ticker: 'META',
      title: 'Meta Platforms Q4 Earnings Report',
      description: 'Social media giant reports on metaverse investments',
      event_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.75,
      confidence_score: 0.85,
      metadata: {
        company_name: 'Meta Platforms Inc.',
        market_cap: 900000000000,
        eps_estimate: 4.8,
        report_time: 'after_close'
      }
    },
    {
      type: 'sec',
      ticker: 'GOOGL',
      title: 'Alphabet Proxy Statement (DEF 14A)',
      description: 'Annual shareholder meeting and executive compensation details',
      event_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.4,
      confidence_score: 0.95,
      metadata: {
        company_name: 'Alphabet Inc.',
        filing_type: 'DEF 14A',
        meeting_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      type: 'earnings',
      ticker: 'JPM',
      title: 'JPMorgan Chase Q4 2024 Earnings',
      description: 'Major bank reports quarterly financials and guidance',
      event_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.7,
      confidence_score: 0.9,
      metadata: {
        company_name: 'JPMorgan Chase & Co.',
        market_cap: 450000000000,
        eps_estimate: 3.2,
        report_time: 'before_open'
      }
    },
    {
      type: 'fda',
      ticker: 'GILD',
      title: 'FDA PDUFA Date: Gilead HIV Prevention Drug',
      description: 'Regulatory decision on long-acting HIV prevention therapy',
      event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.65,
      confidence_score: 0.8,
      metadata: {
        company_name: 'Gilead Sciences Inc.',
        drug_name: 'Lenacapavir',
        indication: 'HIV Prevention',
        pdufa_date: true
      }
    },
    {
      type: 'earnings',
      ticker: 'MSFT',
      title: 'Microsoft Q2 FY2025 Earnings Call',
      description: 'Cloud and AI revenue updates from tech giant',
      event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.85,
      confidence_score: 0.9,
      metadata: {
        company_name: 'Microsoft Corporation',
        market_cap: 2700000000000,
        revenue_estimate: 62000000000,
        report_time: 'after_close'
      }
    },
    // Low impact catalysts
    {
      type: 'sec',
      ticker: 'DIS',
      title: 'Disney 8-K Current Report',
      description: 'Material event disclosure - Board changes',
      event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.3,
      confidence_score: 0.95,
      metadata: {
        company_name: 'The Walt Disney Company',
        filing_type: '8-K',
        event_type: 'Board composition change'
      }
    },
    {
      type: 'earnings',
      ticker: 'KO',
      title: 'Coca-Cola Q4 2024 Earnings',
      description: 'Beverage company quarterly results',
      event_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.35,
      confidence_score: 0.9,
      metadata: {
        company_name: 'The Coca-Cola Company',
        market_cap: 280000000000,
        eps_estimate: 0.68,
        report_time: 'before_open'
      }
    },
    {
      type: 'sec',
      ticker: 'WMT',
      title: 'Walmart Quarterly Report (10-Q)',
      description: 'Q3 2024 financial statements',
      event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      impact_score: 0.45,
      confidence_score: 0.95,
      metadata: {
        company_name: 'Walmart Inc.',
        filing_type: '10-Q',
        fiscal_quarter: 'Q3 2024'
      }
    }
  ]

  // Insert test data
  const { data, error } = await supabase
    .from('catalysts')
    .upsert(testCatalysts, {
      onConflict: 'ticker,event_date',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('Error inserting test data:', error)
    return
  }

  console.log(`Successfully inserted ${testCatalysts.length} test catalysts`)

  // Fetch and display the data
  const { data: catalysts } = await supabase
    .from('catalysts')
    .select('*')
    .order('event_date', { ascending: true })
    .limit(20)

  console.log('\nCurrent catalysts in database:')
  catalysts?.forEach(c => {
    const score = c.impact_score ? (c.impact_score * 100).toFixed(0) : 'N/A'
    console.log(`- ${c.ticker}: ${c.title} (${c.type}) - ${score}% impact`)
  })
}

populateTestData()