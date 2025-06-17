#!/usr/bin/env node

async function findLatestFDAData() {
  console.log('🔍 Finding latest FDA data available...\n')
  
  // Check different years to find the most recent data
  const currentYear = new Date().getFullYear()
  const years = [2024, 2023, 2022, 2021, 2020]
  
  for (const year of years) {
    console.log(`\n📅 Checking year ${year}...`)
    
    // Try each month
    for (let month = 12; month >= 1; month--) {
      const startDate = `${year}${month.toString().padStart(2, '0')}01`
      const endDate = `${year}${month.toString().padStart(2, '0')}31`
      
      const url = `https://api.fda.gov/drug/event.json?search=receivedate:[${startDate}+TO+${endDate}]&limit=1`
      
      try {
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          if (data.results && data.results.length > 0) {
            console.log(`✅ Found data for ${year}-${month.toString().padStart(2, '0')}`)
            console.log(`   Latest event date: ${data.results[0].receivedate}`)
            console.log(`   Total events in range: ${data.meta?.results?.total || 'unknown'}`)
            
            // Get the most recent events
            const recentUrl = `https://api.fda.gov/drug/event.json?sort=receivedate:desc&limit=5`
            const recentResponse = await fetch(recentUrl)
            
            if (recentResponse.ok) {
              const recentData = await recentResponse.json()
              console.log('\n📊 Most recent events in database:')
              recentData.results?.forEach((event: any, i: number) => {
                console.log(`${i + 1}. Date: ${event.receivedate}, ID: ${event.safetyreportid}`)
              })
            }
            
            return
          }
        }
      } catch (error) {
        // Skip errors, just try next month
      }
      
      process.stdout.write('.')
    }
  }
  
  console.log('\n\n❌ Could not find recent FDA data')
}

findLatestFDAData().catch(console.error)