#!/usr/bin/env node

/**
 * source-map-restore.js
 * 
 * Electron ASAR'dan çıkarılan .js.map dosyalarından orijinal kaynak kodu
 * otomatik olarak restore eder.
 * 
 * Kullanım:
 *   node source-map-restore.js <bundle.js.map>
 *   node source-map-restore.js --dir ./extracted-src   # recursive ara
 * 
 * Örnek:
 *   npx asar extract app.asar ./src
 *   node examples/source-map-restore.js --dir ./src
 */

const sourceMap = require('source-map');
const fs = require('fs');
const path = require('path');

async function restoreSingle(mapPath) {
  console.log(`\n📄 İşleniyor: ${mapPath}`);
  const raw = fs.readFileSync(mapPath, 'utf8');
  const mapData = JSON.parse(raw);
  const consumer = await new sourceMap.SourceMapConsumer(mapData);
  
  const outDir = path.join(path.dirname(mapPath), 'restored');
  fs.mkdirSync(outDir, { recursive: true });
  
  let restoredCount = 0;
  consumer.sources.forEach(src => {
    const content = consumer.sourceContentFor(src);
    if (content) {
      // Webpack internal path'lerini temizle
      let filename = src
        .replace(/^webpack:\/\//, '')
        .replace(/^webpack:\/\/\/\//, '')
        .replace(/[\/\\?<>:*|"]/g, '_');
      
      // Çok uzunsa kısalt
      if (filename.length > 200) {
        const ext = path.extname(filename);
        filename = filename.substring(0, 100) + '...' + filename.substring(filename.length - 50) + ext;
      }
      
      const outPath = path.join(outDir, filename);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, content);
      console.log(`  ✅ ${filename} (${content.length} bytes)`);
      restoredCount++;
    }
  });
  
  console.log(`  📊 Toplam: ${restoredCount} dosya restore edildi → ${outDir}/`);
  consumer.destroy();
}

async function findAndRestore(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'restored') {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.js.map') && !entry.name.endsWith('.min.js.map')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  
  if (files.length === 0) {
    console.log('❌ Hiç .js.map dosyası bulunamadı!');
    return;
  }
  
  console.log(`🔍 ${files.length} adet .js.map dosyası bulundu\n`);
  for (const file of files) {
    await restoreSingle(file);
  }
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
🇽 Kullanım:
  node source-map-restore.js <bundle.js.map>     # Tek dosya
  node source-map-restore.js --dir ./src          # Dizinde recursive ara

Örnek:
  npx asar extract app.asar ./src
  node source-map-restore.js --dir ./src
  `);
  process.exit(0);
}

if (args[0] === '--dir' || args[0] === '-d') {
  findAndRestore(args[1] || '.');
} else {
  restoreSingle(args[0]);
}
