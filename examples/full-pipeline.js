#!/usr/bin/env node

/**
 * full-pipeline.js
 * 
 * ASAR'dan çıkarılmış kaynak kodları otomatik olarak deobfuscate eder.
 * Pipeline: Format tespiti → webcrack → prettier → LLM rename (opsiyonel)
 * 
 * Kullanım:
 *   node full-pipeline.js main.js                          # Tek dosya
 *   node full-pipeline.js --dir ./extracted-src             # Tüm JS dosyaları
 *   node full-pipeline.js main.js --humanify               # LLM rename dahil
 *   node full-pipeline.js main.js --output ./decoded        # Çıktı dizini
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkTool(name, installCmd) {
  try {
    execSync(`which ${name} || npx ${name} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    console.log(`⚠️  ${name} bulunamadı. Kurulum: ${installCmd}`);
    return false;
  }
}

function detectFormat(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const first500 = content.substring(0, 500);
  
  if (first500.includes('webpackChunk') || first500.includes('__webpack_require__')) {
    return 'webpack';
  }
  if (first500.includes('_0x') || first500.includes('\\x')) {
    return 'obfuscator';
  }
  if (first500.includes('require(') && first500.includes('module.exports')) {
    return 'browserify';
  }
  if (first500.includes('$=function(') || first500.includes('jscrambler')) {
    return 'jscrambler';
  }
  if (content.split('\n').length <= 3 && content.length > 1000) {
    return 'minified';
  }
  return 'unknown';
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function runPipeline(inputPath, outputDir, useHumanify) {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, basename + '.decoded.js');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 Dosya: ${inputPath}`);
  console.log(`📏 Boyut: ${formatSize(fs.statSync(inputPath).size)}`);
  
  // 1. Format tespiti
  const format = detectFormat(inputPath);
  console.log(`🔍 Format: ${format}`);
  
  // 2. webcrack ile deobfuscate
  if (!checkTool('webcrack', 'npm install -g webcrack')) {
    console.log('❌ webcrack gerekli. Atlanıyor...');
    return;
  }
  
  console.log('⚡ webcrack çalışıyor...');
  const result = spawnSync('npx', ['webcrack', inputPath, '-o', outputDir], {
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf-8',
    timeout: 60000
  });
  
  if (result.status !== 0) {
    console.log(`⚠️  webcrack hata verdi: ${result.stderr?.substring(0, 200)}`);
    console.log('   Alternatif: raw copy ile devam...');
    fs.copyFileSync(inputPath, outputPath);
  } else {
    console.log(`✅ webcrack tamamlandı → ${outputPath}`);
  }
  
  // 3. Prettier ile formatla
  console.log('✨ prettier formatlanıyor...');
  try {
    execSync(`npx prettier --write "${outputPath}" --tab-width 2 2>/dev/null`, { stdio: 'ignore' });
    console.log('✅ prettier tamamlandı');
  } catch {
    console.log('⚠️  prettier başarısız (syntax hatası olabilir, devam)');
  }
  
  // 4. Opsiyonel: humanify ile LLM rename
  if (useHumanify && checkTool('humanify', 'npm install -g humanify')) {
    const humanOutput = path.join(outputDir, basename + '.human.js');
    console.log('🧠 humanify (LLM rename) çalışıyor... Bu biraz uzun sürebilir...');
    const hr = spawnSync('npx', ['humanify', outputPath, '-o', humanOutput], {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 120000
    });
    if (hr.status === 0) {
      console.log(`✅ humanify tamamlandı → ${humanOutput}`);
    } else {
      console.log(`⚠️  humanify başarısız: ${hr.stderr?.substring(0, 100)}`);
    }
  }
  
  // 5. Özet
  const finalSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
  const originalSize = fs.statSync(inputPath).size;
  const ratio = finalSize > 0 ? ((1 - finalSize / originalSize) * 100).toFixed(1) : 0;
  
  console.log(`📊 ${basename}: ${formatSize(originalSize)} → ${formatSize(finalSize)} (${ratio}% küçülme)`);
}

function processDir(dirPath, outputDir, useHumanify) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'restored') {
        walk(fullPath);
      } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dirPath);
  
  if (files.length === 0) {
    console.log('❌ Hiç JS dosyası bulunamadı!');
    return;
  }
  
  console.log(`🔍 ${files.length} JS dosyası bulundu`);
  for (const file of files) {
    runPipeline(file, outputDir, useHumanify);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Toplam ${files.length} dosya işlendi → ${outputDir}/`);
}

// CLI
const args = process.argv.slice(2);
const useHumanify = args.includes('--humanify') || args.includes('-h');
const outputIdx = args.indexOf('--output') !== -1 ? args.indexOf('--output') + 1 : args.indexOf('-o') !== -1 ? args.indexOf('-o') + 1 : -1;
const outputDir = outputIdx !== -1 ? args[outputIdx] : './decoded';
const dirIdx = args.indexOf('--dir') !== -1 ? args.indexOf('--dir') + 1 : args.indexOf('-d') !== -1 ? args.indexOf('-d') + 1 : -1;

// Filter out flags
const targets = args.filter(a => !a.startsWith('-') && a !== outputDir);

fs.mkdirSync(outputDir, { recursive: true });

if (targets.length === 0 && dirIdx === -1) {
  console.log(`
🔄 ASAR Deobfuscation Pipeline
${'─'.repeat(40)}
Kullanım:
  node full-pipeline.js main.js                         # Tek dosya
  node full-pipeline.js --dir ./src                     # Tüm JS dosyaları
  node full-pipeline.js main.js --humanify              # LLM rename dahil
  node full-pipeline.js main.js --output ./decoded      # Çıktı dizini
  
Örnek:
  npx asar extract app.asar ./src
  node examples/full-pipeline.js --dir ./src --output ./decoded
  `);
  process.exit(0);
}

if (dirIdx !== -1) {
  processDir(args[dirIdx], outputDir, useHumanify);
} else {
  for (const target of targets) {
    if (fs.existsSync(target)) {
      runPipeline(target, outputDir, useHumanify);
    } else {
      console.log(`❌ Dosya bulunamadı: ${target}`);
    }
  }
}
