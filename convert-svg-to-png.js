// Script to convert SVG files to PNG
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Define directories
const sourceDir = path.join(__dirname, 'public', 'images');
const targetDir = path.join(__dirname, 'public', 'images', 'png');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Function to recursively process directories
async function processDirectory(sourceDir, targetDir) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Read source directory
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    
    // Skip the png directory itself to avoid recursion issues
    if (entry.isDirectory() && entry.name === 'png') {
      continue;
    }
    
    // Process directories recursively
    if (entry.isDirectory()) {
      const newTargetDir = path.join(targetDir, entry.name);
      await processDirectory(sourcePath, newTargetDir);
    } 
    // Process SVG files
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.svg') {
      const pngFileName = path.basename(entry.name, '.svg') + '.png';
      const targetPath = path.join(targetDir, pngFileName);
      
      console.log(`Converting ${sourcePath} to ${targetPath}`);
      
      try {
        // Convert SVG to PNG with 2x scale
        await sharp(sourcePath)
          .resize({ width: undefined, height: undefined, fit: 'contain' })
          .png()
          .toFile(targetPath);
        
        console.log(`  ✓ Success: ${pngFileName}`);
      } catch (err) {
        console.error(`  ✗ Error converting ${entry.name}:`, err.message);
      }
    }
  }
}

// Start the conversion process
async function main() {
  console.log('Starting SVG to PNG conversion...');
  
  try {
    // Process each subdirectory in images
    const baseEntries = fs.readdirSync(sourceDir, { withFileTypes: true });
    
    for (const entry of baseEntries) {
      // Skip png directory and README file
      if (entry.name === 'png' || entry.name === 'README.md') {
        continue;
      }
      
      if (entry.isDirectory()) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        await processDirectory(sourcePath, targetPath);
      }
    }
    
    console.log('Conversion complete!');
  } catch (err) {
    console.error('Error during conversion:', err);
  }
}

main();