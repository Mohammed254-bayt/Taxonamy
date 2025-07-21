const fs = require('fs');
const { parse } = require('csv-parse');

// Simple script to import remaining CSV data
async function importTaxonomyGroups() {
  console.log('Starting taxonomy groups import...');
  
  const records = [];
  let processed = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('attached_assets/taxonomy_groups.csv')
      .pipe(parse({ 
        columns: true, 
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true
      }))
      .on('data', (record) => {
        if (record.esco_code && record.preferred_label_en) {
          processed++;
          if (processed <= 1000) { // Process first 1000 for testing
            records.push({
              gstId: record.esco_code,
              preferredLabelEn: record.preferred_label_en,
              descriptionEn: record.description_en || '',
              descriptionAr: record.description_ar || '',
              altLabels: record.alt_labels ? record.alt_labels.split(',').map(s => s.trim()) : []
            });
          }
        }
      })
      .on('error', (error) => {
        console.error('Parse error:', error);
        reject(error);
      })
      .on('end', () => {
        console.log(`Parsed ${records.length} taxonomy groups`);
        resolve(records);
      });
  });
}

// Run the import
importTaxonomyGroups()
  .then(records => {
    console.log('Sample records:', records.slice(0, 3));
    console.log('Total records to import:', records.length);
  })
  .catch(error => {
    console.error('Import failed:', error);
  });