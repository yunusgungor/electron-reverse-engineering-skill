---
layout: default
title: Hızlı Başlangıç Rehberi
---

# 🚀 Hızlı Başlangıç Rehberi

> 5 dakikada Electron uygulamasının kaynak koduna erişin.

## Adım 1: ASAR'ı Bul ve Extract Et

```bash
# macOS
find /Applications/<App>.app -type f -iname "*.asar"

# Windows
dir %LOCALAPPDATA%\<app>\resources\*.asar

# Extract
npx asar extract app.asar ./src
cd src
```

## Adım 2: Source Map Kontrolü

```bash
find . -name "*.js.map"
```

**VARSA (🟢 %100):**
```bash
npm install -g source-map
node -e "
const sm = require('source-map'), fs = require('fs');
async function go() {
  const raw = fs.readFileSync('renderer.js.map','utf8');
  const c = await new sm.SourceMapConsumer(JSON.parse(raw));
  c.sources.forEach(s => {
    const ct = c.sourceContentFor(s);
    if(ct) fs.writeFileSync('restored/'+s.replace(/[\\/\\\\]/g,'_'), ct);
  });
  console.log('✅ Restored '+c.sources.length+' files');
}
go();
"
```

**YOKSA (🟢 %95):**
```bash
npm install -g webcrack
webcrack main.js -o decoded/
npx prettier --write decoded/*.js
```

## Adım 3: Keşif

```bash
# API endpoint'leri
find . -name "*.js" | head -20 | xargs grep -h "https\?://" | sort -u | grep -E "(api|graphql)"

# Secret'lar
grep -r "api_key\|secret\|token\|license" --include="*.js" --include="*.env"

# .env dosyaları
find . -name ".env*" -exec cat {} \;
```

## Adım 4: Değişiklik Yap ve Repack

```bash
# Değişiklikler yapıldıktan sonra:
mv app.asar app.asar.bak
asar pack ./decoded app.asar
```

## Adım 5: Integrity Bypass

```bash
# macOS
npx @electron/fuses read --app /Applications/Target.app
# Hash'i kontrol et, Info.plist'e yaz
```

Detaylar için: [Ana Skill Dokümanı](../skill/SKILL.md)

---

👉 **Tool karşılaştırması:** [tools.md](tools.md)
👉 **Vaka çalışmaları:** [case-studies.md](case-studies.md)
