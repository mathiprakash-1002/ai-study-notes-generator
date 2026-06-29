const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'server.js',
  '.env.example',
  'public/index.html',
  'public/style.css',
  'public/app.js'
];

console.log('=== Starting StudySpark AI Project Verification ===\n');

let missingCount = 0;

requiredFiles.forEach(file => {
  const absolutePath = path.join(__dirname, file);
  if (fs.existsSync(absolutePath)) {
    const stats = fs.statSync(absolutePath);
    console.log(`[OK] Found: ${file} (${stats.size} bytes)`);
  } else {
    console.error(`[ERROR] Missing: ${file}`);
    missingCount++;
  }
});

if (missingCount > 0) {
  console.error(`\nVerification FAILED. ${missingCount} required files are missing.`);
  process.exit(1);
}

console.log('\n=== Verification SUCCESS ===');
console.log('To run the server, use: npm run start');
process.exit(0);
