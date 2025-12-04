const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Building backend...');

// Créer le répertoire de sortie s'il n'existe pas
const outputDir = path.join(__dirname, 'dist', 'server');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copier les fichiers nécessaires
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'api/index.js',
  'server/**/*',
  'shared/**/*'
];

console.log('📦 Copying files...');
filesToCopy.forEach(file => {
  const source = path.join(__dirname, file);
  const dest = path.join(outputDir, file);
  
  if (fs.existsSync(source)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    if (fs.lstatSync(source).isDirectory()) {
      copyRecursiveSync(source, dest);
    } else {
      fs.copyFileSync(source, dest);
    }
  }
});

console.log('✅ Backend build completed!');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
