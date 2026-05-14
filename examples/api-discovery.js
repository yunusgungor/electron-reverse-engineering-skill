#!/usr/bin/env node

/**
 * api-discovery.js
 * 
 * Electron uygulamasının kaynak kodundan API endpoint'lerini, secret'ları
 * ve çevre değişkenlerini otomatik olarak keşfeder.
 * 
 * Kullanım:
 *   node api-discovery.js ./extracted-src
 *   node api-discovery.js ./extracted-src --deep    # Daha detaylı tarama
 */

const fs = require('fs');
const path = require('path');

// Desenler
const URL_PATTERNS = [
  /https?:\/\/[^\s"'`,;)]+/gi,
  /['"`](https?:\/\/[^'"`\s]+)['"`]/gi,
];

const SECRET_PATTERNS = [
  /api[_\-]?key['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /secret['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /token['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /password['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /license['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /api_key=['"]([^'"]+)/gi,
  /sk-[-_a-zA-Z0-9]{20,}/g,     // OpenAI API key
  /ghp_[-_a-zA-Z0-9]{36}/g,     // GitHub PAT
  /AKIA[0-9A-Z]{16}/g,           // AWS Access Key
];

const ENV_PATTERNS = [
  /process\.env\.(\w+)/g,
  /env\[['"`](\w+)['"`]\]/g,
  /import\.meta\.env\.(\w+)/g,
];

const TELEMETRY_PATTERNS = [
  /trackEvent|track|analytics|telemetry|posthog|amplitude|mixpanel|segment/i,
  /google-analytics|gtag|ga\(|fbq\(/i,
];

const API_PATH_PATTERNS = [
  /\/api\//gi,
  /\/graphql/gi,
  /\/v[0-9]+\//gi,
  /\/rest\//gi,
  /\/rpc\//gi,
];

function collectFiles(dir) {
  const results = [];
  
  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'restored'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.env') || entry.name.endsWith('.json')) {
          results.push(fullPath);
        }
      }
    } catch {}
  }
  
  walk(dir);
  return results;
}

function extractMatches(content, patterns) {
  const results = new Set();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      results.add(match[1] || match[0]);
    }
  }
  return [...results];
}

async function scan(dir, deepMode) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 API Keşif Taraması Başlıyor`);
  console.log(`📂 Hedef: ${dir}`);
  console.log(`${'='.repeat(60)}`);
  
  if (!fs.existsSync(dir)) {
    console.log(`❌ Dizin bulunamadı: ${dir}`);
    return;
  }
  
  const files = collectFiles(dir);
  console.log(`📊 ${files.length} dosya taranacak\n`);
  
  const allUrls = new Set();
  const allSecrets = new Set();
  const allEnvs = new Set();
  const allTelemetry = new Set();
  const allApiPaths = new Set();
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relPath = path.relative(dir, file);
      
      // URL'ler
      const urls = extractMatches(content, URL_PATTERNS);
      for (const url of urls) allUrls.add(url);
      
      // Secret'lar
      const secrets = extractMatches(content, SECRET_PATTERNS);
      for (const s of secrets) allSecrets.add(s);
      
      // Env var'ları
      const envs = extractMatches(content, ENV_PATTERNS);
      for (const e of envs) allEnvs.add(e);
      
      // Telemetri
      if (TELEMETRY_PATTERNS.some(p => p.test(content))) {
        allTelemetry.add(relPath);
      }
      
      // API path'leri
      if (deepMode) {
        const matches = extractMatches(content, API_PATH_PATTERNS);
        for (const m of matches) allApiPaths.add(m);
      }
    } catch {}
  }
  
  // Rapor
  console.log(`📋 TARAMA RAPORU`);
  console.log(`${'─'.repeat(40)}`);
  
  console.log(`\n🌐 URL'ler (${allUrls.size} adet):`);
  [...allUrls].sort().slice(0, 30).forEach(u => console.log(`  🔗 ${u}`));
  if (allUrls.size > 30) console.log(`  ... ve ${allUrls.size - 30} tane daha`);
  
  console.log(`\n🔑 Secret'lar (${allSecrets.size} adet):`);
  [...allSecrets].forEach(s => console.log(`  ⚠️  ${s.substring(0, 60)}${s.length > 60 ? '...' : ''}`));
  
  console.log(`\n📦 Environment Variable'lar (${allEnvs.size} adet):`);
  [...allEnvs].sort().forEach(e => console.log(`  • ${e}`));
  
  console.log(`\n📡 Telemetri Tespit Edilen Dosyalar (${allTelemetry.size} adet):`);
  [...allTelemetry].forEach(f => console.log(`  📄 ${f}`));
  
  if (deepMode && allApiPaths.size > 0) {
    console.log(`\n🔁 API Path'leri: ${[...allApiPaths].sort().join(', ')}`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Tarama tamamlandı!`);
}

// CLI
const args = process.argv.slice(2);
const deepMode = args.includes('--deep') || args.includes('-d');
const target = args.filter(a => !a.startsWith('-'))[0] || '.';

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔍 Electron API Keşif Aracı

Kullanım:
  node api-discovery.js ./extracted-src              # Standart tarama
  node api-discovery.js ./extracted-src --deep       # Detaylı tarama
  node api-discovery.js . --deep                     # Bulunduğun dizinde
  
Örnek:
  npx asar extract app.asar ./src
  node examples/api-discovery.js ./src --deep
  `);
  process.exit(0);
}

scan(target, deepMode);
