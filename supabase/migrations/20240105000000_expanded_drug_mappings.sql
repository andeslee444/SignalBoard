-- Expanded drug mappings for comprehensive pharma coverage
-- Top 50 drugs by market cap and FDA activity

INSERT INTO drug_mappings (drug_name, generic_name, brand_names, primary_ticker, related_tickers, drug_class, indication, manufacturer) VALUES
-- Existing drugs are skipped due to unique constraint

-- Additional oncology drugs
('TECENTRIQ', 'atezolizumab', ARRAY['Tecentriq'], 'RHHBY', ARRAY['MRK', 'BMY'], 'PD-L1 inhibitor', 'Various cancers', 'Roche'),
('DARZALEX', 'daratumumab', ARRAY['Darzalex', 'Darzalex Faspro'], 'JNJ', ARRAY['GILD', 'CELG'], 'CD38 antibody', 'Multiple myeloma', 'Johnson & Johnson'),
('IMBRUVICA', 'ibrutinib', ARRAY['Imbruvica'], 'ABBV', ARRAY['JNJ'], 'BTK inhibitor', 'Blood cancers', 'AbbVie/J&J'),
('TAGRISSO', 'osimertinib', ARRAY['Tagrisso'], 'AZN', ARRAY['RHHBY', 'PFE'], 'EGFR inhibitor', 'Lung cancer', 'AstraZeneca'),
('LYNPARZA', 'olaparib', ARRAY['Lynparza'], 'AZN', ARRAY['MRK'], 'PARP inhibitor', 'Ovarian/breast cancer', 'AstraZeneca/Merck'),

-- Immunology & Inflammation
('DUPIXENT', 'dupilumab', ARRAY['Dupixent'], 'SNY', ARRAY['REGN'], 'IL-4/IL-13 inhibitor', 'Atopic dermatitis', 'Sanofi/Regeneron'),
('RINVOQ', 'upadacitinib', ARRAY['Rinvoq'], 'ABBV', ARRAY['PFE', 'BMY'], 'JAK inhibitor', 'Rheumatoid arthritis', 'AbbVie'),
('SKYRIZI', 'risankizumab', ARRAY['Skyrizi'], 'ABBV', ARRAY['JNJ', 'NVS'], 'IL-23 inhibitor', 'Psoriasis', 'AbbVie'),
('COSENTYX', 'secukinumab', ARRAY['Cosentyx'], 'NVS', ARRAY['ABBV', 'JNJ'], 'IL-17A inhibitor', 'Psoriasis', 'Novartis'),
('TREMFYA', 'guselkumab', ARRAY['Tremfya'], 'JNJ', ARRAY['ABBV', 'NVS'], 'IL-23 inhibitor', 'Psoriasis', 'Johnson & Johnson'),

-- Diabetes & Metabolic
('OZEMPIC', 'semaglutide', ARRAY['Ozempic', 'Wegovy', 'Rybelsus'], 'NVO', ARRAY['LLY'], 'GLP-1 agonist', 'Diabetes/Obesity', 'Novo Nordisk'),
('MOUNJARO', 'tirzepatide', ARRAY['Mounjaro', 'Zepbound'], 'LLY', ARRAY['NVO'], 'GIP/GLP-1 agonist', 'Diabetes/Obesity', 'Eli Lilly'),
('JARDIANCE', 'empagliflozin', ARRAY['Jardiance'], 'LLY', ARRAY['AZN', 'JNJ'], 'SGLT2 inhibitor', 'Diabetes', 'Lilly/Boehringer'),
('FARXIGA', 'dapagliflozin', ARRAY['Farxiga', 'Forxiga'], 'AZN', ARRAY['JNJ', 'LLY'], 'SGLT2 inhibitor', 'Diabetes/Heart failure', 'AstraZeneca'),

-- Cardiovascular
('ENTRESTO', 'sacubitril/valsartan', ARRAY['Entresto'], 'NVS', ARRAY['AZN', 'PFE'], 'ARNI', 'Heart failure', 'Novartis'),
('REPATHA', 'evolocumab', ARRAY['Repatha'], 'AMGN', ARRAY['SNY', 'REGN'], 'PCSK9 inhibitor', 'High cholesterol', 'Amgen'),
('PRALUENT', 'alirocumab', ARRAY['Praluent'], 'SNY', ARRAY['REGN', 'AMGN'], 'PCSK9 inhibitor', 'High cholesterol', 'Sanofi/Regeneron'),

-- Rare Diseases
('SPINRAZA', 'nusinersen', ARRAY['Spinraza'], 'BIIB', ARRAY['RHHBY', 'NVS'], 'ASO', 'Spinal muscular atrophy', 'Biogen'),
('HEMLIBRA', 'emicizumab', ARRAY['Hemlibra'], 'RHHBY', ARRAY['BIIB', 'CSL'], 'Factor VIII substitute', 'Hemophilia A', 'Roche'),
('VYVGART', 'efgartigimod', ARRAY['Vyvgart'], 'ARGX', ARRAY['BIIB', 'RHHBY'], 'FcRn antagonist', 'Myasthenia gravis', 'Argenx'),
('ULTOMIRIS', 'ravulizumab', ARRAY['Ultomiris'], 'ALXN', ARRAY['BIIB', 'SGEN'], 'C5 inhibitor', 'PNH/aHUS', 'Alexion/AstraZeneca'),

-- Vaccines
('COMIRNATY', 'tozinameran', ARRAY['Comirnaty', 'Pfizer-BioNTech COVID-19 Vaccine'], 'PFE', ARRAY['BNTX', 'MRNA'], 'mRNA vaccine', 'COVID-19', 'Pfizer/BioNTech'),
('SPIKEVAX', 'elasomeran', ARRAY['Spikevax', 'Moderna COVID-19 Vaccine'], 'MRNA', ARRAY['PFE', 'BNTX'], 'mRNA vaccine', 'COVID-19', 'Moderna'),
('SHINGRIX', 'zoster vaccine', ARRAY['Shingrix'], 'GSK', ARRAY['MRK', 'PFE'], 'Recombinant vaccine', 'Shingles', 'GSK'),
('GARDASIL', 'HPV vaccine', ARRAY['Gardasil', 'Gardasil 9'], 'MRK', ARRAY['GSK', 'PFE'], 'VLP vaccine', 'HPV', 'Merck'),

-- Neurology/Psychiatry
('VRAYLAR', 'cariprazine', ARRAY['Vraylar', 'Reagila'], 'ABBV', ARRAY['BMY', 'LLY'], 'Atypical antipsychotic', 'Bipolar/Schizophrenia', 'AbbVie'),
('AUSTEDO', 'deutetrabenazine', ARRAY['Austedo'], 'TEVA', ARRAY['NBIX', 'ACAD'], 'VMAT2 inhibitor', 'Tardive dyskinesia', 'Teva'),
('NUPLAZID', 'pimavanserin', ARRAY['Nuplazid'], 'ACAD', ARRAY['BIIB', 'TEVA'], '5-HT2A antagonist', 'Parkinsons psychosis', 'Acadia'),

-- Respiratory
('TRIKAFTA', 'elexacaftor/tezacaftor/ivacaftor', ARRAY['Trikafta'], 'VRTX', ARRAY[], 'CFTR modulator', 'Cystic fibrosis', 'Vertex'),
('FASENRA', 'benralizumab', ARRAY['Fasenra'], 'AZN', ARRAY['GSK', 'TEVA'], 'IL-5 antagonist', 'Severe asthma', 'AstraZeneca'),
('NUCALA', 'mepolizumab', ARRAY['Nucala'], 'GSK', ARRAY['AZN', 'TEVA'], 'IL-5 antagonist', 'Severe asthma', 'GSK'),

-- Eye Diseases
('EYLEA', 'aflibercept', ARRAY['Eylea'], 'REGN', ARRAY['RHHBY', 'NVS'], 'VEGF inhibitor', 'AMD/DME', 'Regeneron/Bayer'),
('LUCENTIS', 'ranibizumab', ARRAY['Lucentis'], 'RHHBY', ARRAY['REGN', 'NVS'], 'VEGF inhibitor', 'AMD/DME', 'Roche/Novartis'),
('BEOVU', 'brolucizumab', ARRAY['Beovu'], 'NVS', ARRAY['REGN', 'RHHBY'], 'VEGF inhibitor', 'AMD', 'Novartis'),

-- Gene Therapy
('ZOLGENSMA', 'onasemnogene abeparvovec', ARRAY['Zolgensma'], 'NVS', ARRAY['BIIB', 'SRPT'], 'Gene therapy', 'SMA', 'Novartis'),
('LUXTURNA', 'voretigene neparvovec', ARRAY['Luxturna'], 'RHHBY', ARRAY['BIIB', 'EDIT'], 'Gene therapy', 'Retinal dystrophy', 'Spark/Roche'),

-- Additional major drugs
('TALTZ', 'ixekizumab', ARRAY['Taltz'], 'LLY', ARRAY['ABBV', 'NVS'], 'IL-17A inhibitor', 'Psoriasis', 'Eli Lilly'),
('OTEZLA', 'apremilast', ARRAY['Otezla'], 'AMGN', ARRAY['BMY', 'JNJ'], 'PDE4 inhibitor', 'Psoriasis', 'Amgen'),
('OCREVUS', 'ocrelizumab', ARRAY['Ocrevus'], 'RHHBY', ARRAY['BIIB', 'NVS'], 'CD20 antibody', 'Multiple sclerosis', 'Roche')

ON CONFLICT (drug_name, primary_ticker) DO UPDATE SET
  brand_names = EXCLUDED.brand_names,
  related_tickers = EXCLUDED.related_tickers,
  drug_class = EXCLUDED.drug_class,
  indication = EXCLUDED.indication,
  updated_at = NOW();

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_drug_generic_name ON drug_mappings(generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_brand_names ON drug_mappings USING GIN(brand_names);
CREATE INDEX IF NOT EXISTS idx_drug_indication ON drug_mappings(indication);

-- Create a function to search drugs by any name
CREATE OR REPLACE FUNCTION search_drug_mapping(search_term TEXT)
RETURNS TABLE (
  drug_name TEXT,
  primary_ticker TEXT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    dm.drug_name,
    dm.primary_ticker,
    CASE
      WHEN dm.drug_name ILIKE '%' || search_term || '%' THEN 'drug_name'
      WHEN dm.generic_name ILIKE '%' || search_term || '%' THEN 'generic_name'
      WHEN EXISTS (SELECT 1 FROM unnest(dm.brand_names) AS brand WHERE brand ILIKE '%' || search_term || '%') THEN 'brand_name'
      ELSE 'unknown'
    END as match_type
  FROM drug_mappings dm
  WHERE 
    dm.drug_name ILIKE '%' || search_term || '%' OR
    dm.generic_name ILIKE '%' || search_term || '%' OR
    EXISTS (SELECT 1 FROM unnest(dm.brand_names) AS brand WHERE brand ILIKE '%' || search_term || '%');
END;
$$ LANGUAGE plpgsql;