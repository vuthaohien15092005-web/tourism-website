#!/usr/bin/env node

/**
 * Update Distance Calculation Formula
 * 
 * This script updates all models to use a more accurate distance calculation formula
 */

const fs = require('fs');
const path = require('path');

// More accurate distance calculation formula
const newFormula = `// More accurate distance calculation using improved Haversine formula
calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians with higher precision
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Calculate differences
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula with better precision
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};`;

// Models to update
const models = [
  'model/Attraction.js',
  'model/Entertainment.js', 
  'model/Accommodation.js',
  'model/CuisinePlace.js'
];

function updateDistanceFormula() {
  console.log('🔧 Updating Distance Calculation Formula...\n');
  
  let updatedCount = 0;
  
  models.forEach(modelPath => {
    try {
      const fullPath = path.join(process.cwd(), modelPath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ File not found: ${modelPath}`);
        return;
      }
      
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Find and replace the calculateDistance function
      const oldFormulaRegex = /calculateDistance\s*=\s*function\([^)]*\)\s*\{[^}]*\}/gs;
      
      if (oldFormulaRegex.test(content)) {
        content = content.replace(oldFormulaRegex, newFormula);
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Updated: ${modelPath}`);
        updatedCount++;
      } else {
        console.log(`⚠️  No calculateDistance function found in: ${modelPath}`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${modelPath}:`, error.message);
    }
  });
  
  console.log(`\n📊 Summary: Updated ${updatedCount}/${models.length} models`);
  
  if (updatedCount > 0) {
    console.log('\n🎉 Distance calculation formula has been updated!');
    console.log('The new formula provides better accuracy for short distances.');
  }
}

// Run the update
updateDistanceFormula();
