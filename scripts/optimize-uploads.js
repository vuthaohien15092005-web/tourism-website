const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    await sharp(inputPath)
      .jpeg({ quality: 85, progressive: true })  // Tăng từ 80 lên 85
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    const newStats = fs.statSync(outputPath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)}: ${(originalSize/1024/1024).toFixed(1)}MB → ${(newSize/1024/1024).toFixed(1)}MB (${savings}% saved)`);
    
    return { originalSize, newSize, savings };
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
    return null;
  }
}

async function optimizeUploads() {
  const uploadsDir = './public/uploads';
  const files = fs.readdirSync(uploadsDir);
  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let processedCount = 0;
  
  console.log('🚀 Starting image optimization...');
  
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && file.match(/\.(jpg|jpeg|png)$/i)) {
      const tempPath = filePath + '.tmp';
      const result = await optimizeImage(filePath, tempPath);
      
      if (result) {
        // Replace original with optimized version
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        
        totalOriginalSize += result.originalSize;
        totalNewSize += result.newSize;
        processedCount++;
      }
    }
  }
  
  const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1);
  console.log(`\n✅ Optimization completed!`);
  console.log(`📊 Processed: ${processedCount} files`);
  console.log(`💾 Total size: ${(totalOriginalSize/1024/1024).toFixed(1)}MB → ${(totalNewSize/1024/1024).toFixed(1)}MB`);
  console.log(`🎯 Space saved: ${totalSavings}% (${((totalOriginalSize - totalNewSize)/1024/1024).toFixed(1)}MB)`);
}

if (require.main === module) {
  optimizeUploads().catch(console.error);
}

module.exports = { optimizeUploads };
