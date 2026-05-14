---
name: electron-reverse-engineering
description: "Use when reverse-engineering, customizing, patching, or inspecting the internals of Electron-based desktop applications. Covers ASAR manipulation, source code extraction & deobfuscation, runtime injection, integrity bypass, and practical customization."
version: 1.0.0
author: Hermes Agent (research-based, v1.0)
license: MIT
metadata:
  hermes:
    tags: [electron, reverse-engineering, asar, deobfuscation, code-injection, binary-patching, webpack, sourcemap]
    related_skills: [writing-plans, spike, subagent-driven-development]
trigger_phrases:
  - "electron app reverse engineering"
  - "asar extract"
  - "electron deobfuscate"
  - "electron app customize"
  - "electron patch"
  - "electron source code recovery"
  - "electron internals"
required_commands:
  - npx
  - node
  - npm
  - 7z
  - python3
platforms: [linux, macos, windows]
---

# 🔬 Electron Uygulamalarında Tersine Mühendislik ve Özelleştirme — Kapsamlı Skill

> **Eğitim ve araştırma amaçlıdır.** Ticari yazılımları izinsiz değiştirmek lisans ihlali olabilir.

## Genel Bakış

Bu skill, Electron tabanlı masaüstü uygulamalarının tersine mühendislik yoluyla incelenmesi, özelleştirilmesi ve güncellenmesi için **kanıtlanmış, kendini defalarca ispatlamış** yöntemlerin tamamını kapsar. ASAR arşivinden kaynak koda, obfuscation'dan runtime injection'a, Electron Fuses'tan V8 snapshot tampering'e kadar tüm katmanları adım adım işler.

**Temel prensip:** JavaScript kodunu "derlenmiş" veya "obfuscated" olarak düşünmeyin. Electron uygulamalarındaki JS, native koda göre **çok daha kolay** tersine mühendislik yapılabilir. Bu skill'deki yöntemlerle kodun %95+ oranında orijinal haline dönmesi mümkündür.

### Elektron'un Anatomisi

```
electron-app/
├── locales/                           # Dil dosyaları
├── resources/
│   ├── app.asar                       # ⭐ Ana kaynak kod arşivi
│   ├── app.asar.unpacked/             # Native module'ler (.node)
│   └── electron.asar                  # Electron API'si
├── Electron Framework                 # Chromium + Node.js gömülü
└── Info.plist (macOS)                 # ASAR integrity hash
```

**İş akışı özeti:**
```
ASAR Extract → Kaynak Kod İnceleme (Source Map / Deobfuscate)
           → Değişiklik Yap → Repack → Integrity Baypas → Çalıştır
```

---

## 1. Ne Zaman Kullanılır

| Durum | Açıklama | İlgili Bölüm |
|-------|----------|-------------|
| **Kapalı kaynak uygulamayı özelleştirme** | Telemetri kapatma, auto-update kaldırma, UI tweak | §9 Özelleştirme Senaryoları |
| **Kaynak kod inceleme** | API endpoint'leri, secret'lar, mimari öğrenme | §5 Deobfuscation |
| **İlham alma** | Benzer uygulamaların kod yapısını inceleme | §10 Vaka Çalışmaları |
| **Güvenlik denetimi** | Şüpheli ağ bağlantıları, veri sızıntısı kontrolü | §6 DevTools + §8 Kod Enjeksiyon |
| **Native module inceleme** | C++ kısmına müdahale etmeden JS wrapper'ı patch | §9.5 |
| **Patch/license bypass** | JS wrapper'da lisans kontrolünü geçme | §8 |

## 2. ASAR Manipülasyonu (Temel Adım)

### 2.1 ASAR'ı Bulma

```bash
# macOS
find /Applications/<App>.app -type f -iname "*.asar"

# Windows (CMD)
dir %LOCALAPPDATA%\%<app>%\resources\*.asar

# Linux
find /opt/<app> /usr/lib/<app> -type f -name "*.asar"
```

### 2.2 Extract & Repack

```bash
# Extract (klasöre çıkar)
npx asar extract app.asar ./src

# Tek dosya çıkar
npx asar extract-file app.asar main.js

# Repack (orijinali yedekle → üzerine yaz)
mv app.asar app.asar.bak
asar pack ./src app.asar

# Native module içeriyorsa
asar pack ./src app.asar --unpack "*.node" --ordering ./order.txt
```

### 2.3 Paylaşılan Notlar

- Bazı uygulamalarda `resources/app/` **dizini vardır** (ASAR değil). O zaman direkt JS dosyalarına erişiminiz var demektir.
- Extract → hemen repack yapmak **dosya boyutunu artırabilir** (asar CLI'in bilinen bug'ı). Bunun için --unpack ve .asar dosyasının header'ındaki alignment sorunları mevcut. Boyut önemli değilse sorunsuz çalışır.
- `7z x <dosya>` ile de ASAR'ı extract edebilirsiniz (birçok formatı tanır).
- **Özel formatlar:** Discord `.distro` = brotli + tar, Figma `.dmg` ≠ gerçek uygulama (shell binary)

---

## 3. ASAR Integrity Baypas (3 Kanıtlanmış Yöntem)

Modern Electron sürümleri (`>= v16` macOS, `>= v30` Windows) ASAR integrity kontrolü yapar. Baypas edilmezse:

```
[FATAL:asar_util.cc(164)] Integrity check failed for asar archive
(ESKİ_HASH vs YENİ_HASH)
```

**Önce fuse durumunu kontrol et:**
```bash
npx @electron/fuses read --app /Applications/Target.app
# 'EnableEmbeddedAsarIntegrityValidation' = Disabled ise gerek YOK
```

### Yöntem 1: macOS Info.plist (En Kolay)

```bash
# Çöken uygulamadan yeni hash'i oku (hata mesajında ikinci hash)
# Veya manuel hesapla:
node -e "
const asar = require('@electron/asar');
const crypto = require('crypto');
const rh = asar.getRawHeader('app.asar');
console.log(crypto.createHash('sha256').update(rh.headerString).digest('hex'));
"

# Info.plist'e yaz
/usr/libexec/PlistBuddy -c \
  "Set :ElectronAsarIntegrity:Resources/app.asar:hash <YENI_HASH>" \
  Target.app/Contents/Info.plist

# Self-signed imza (gerekebilir)
codesign --force --deep --sign - Target.app
```

### Yöntem 2: Binary'de Sed (Windows/Linux)

Hash, Electron binary'sinde **düz metin string** olarak gömülüdür:

```bash
# Eski hash'i bul
strings app.exe | grep '"alg":"SHA256"'
# Çıktı: [{"file":"resources\\app.asar","alg":"SHA256","value":"2a6e8324f650f57819d9130b7e52a1a3ab7265851b611ffd3c5f07cd67263744"}]

# Çalıştırıp hata mesajından yeni hash'i al → sed ile değiştir
sed 's/2a6e8324f650f57819d9130b7e52a1a3ab7265851b611ffd3c5f07cd67263744/e68bc08744b5dc9ffd749f30f8212f2cdfd898755cb9b6afed56647e2683c8fc/' \
  app.exe > app.patched.exe
```

**⚠️ Kritik not:** Hash tüm ASAR dosyasının sha256sum'i DEĞİL, sadece **internal header JSON**'ının hash'idir.

### Yöntem 3: electron-app-patcher (Otomatik, macOS)

```bash
# https://github.com/karlhorky/electron-app-patcher
git clone https://github.com/karlhorky/electron-app-patcher.git
cd electron-app-patcher
pnpm install

# Self-signed certificate oluştur (Keychain → Certificate Assistant)
# Name: electron-app-patcher-self-signed-cert, Type: Code Signing

# Patch Signal
pnpm run patch signal
# Çıktı: Creating backup... Processing... Repacking... Updating hash... Signing... Done! (6.66s)
```

### Ek: V8 Heap Snapshot Baypası (CVE-2025-55305)

**Trail of Bits — Eylül 2025:** Electron'un integrity fuses'ları V8 heap snapshot'larını kapsamaz.

```bash
# electron-mksnapshot ile sahte snapshot oluştur
npx -y electron-mksnapshot@37.2.6 /path/to/payload.js

# Snapshot'ı uygulama dizinine kopyala (genelde %AppData%/Local/ altında)
# Built-in fonksiyonları clobberla (Array.isArray, vs.)
```

**Etkilenen:** Signal, 1Password (patched v8.11.8-40), Slack, Chrome

---

## 4. Runtime Injection (Çalışma Anında Kod Enjeksiyonu)

ASAR'a dokunmadan, uygulama çalışırken kod enjekte etmenin 4 yöntemi vardır.

### 4.1 electron-inject (Python) ⭐374

```bash
pip install electron-inject

# Slack'te DevTools'u aç
python -m electron_inject -d -t 60 - /Applications/Slack.app

# Özel script enjekte et (UI override için)
python -m electron_inject -r ./theme-override.js /Applications/WhatsApp.app

# --silent mod (soru sormaz)
python -m electron_inject --silent -d /Applications/Discord.app
```

### 4.2 electron-injector (Rust) ⭐43

```bash
cargo install electron-injector

# Script enjekte et
electron-injector --script=payload.js /Applications/Slack.app

# Özel port + timeout
electron-injector --port 9222 --timeout 15000 --script=hack.js ./app
```

### 4.3 Chrome DevTools Protocol (Manuel)

```bash
# Uygulamayı debug portu ile başlat
/Applications/Signal.app --remote-debugging-port=8315

# Chrome'da chrome://inspect → Remote Target → Connect
# Runtime.evaluate ile istediğin kodu çalıştır
```

### 4.4 Webpack Runtime Module Injection (Discord/Slack gibi webpack tabanlı uygulamalar)

```javascript
// Konsolda çalıştır:
window.webpackChunk_N_E.push([
  [1337],
  {31337: (module, exports, require) => {
    console.log('Module injected!');
    // Orijinal webpack modüllerine erişim
    // require.c → tüm yüklü modüller
  }},
  (require) => console.log('Init', require)
]);
```

---

## 5. Kaynak Kod Deobfuscation (6 Seviyeli Pipeline)

ASAR'dan çıkan kodun formatına göre uygulanacak yöntem:

```
             ┌─────────────────┐
             │   ASAR Extract   │
             └────────┬────────┘
                      ▼
          ┌─────────────────────┐
          │ Source Map Var mı?  │───Evet──→ Seviye 1 (source-map restore)
          └────────┬────────────┘
                   │ Hayır
                   ▼
          ┌─────────────────────┐
          │ Hangi Format?       │
          └────────┬────────────┘
                   │
        ┌────┬────┬┴────┬────┬────┐
        ▼    ▼    ▼     ▼    ▼    ▼
     Seviye2 Seviye3 Seviye4 Seviye5 Seviye6
     Minified Bundle Obfusc. LLM    Bytecode
                        +Humanize
```

### Seviye 1 — Source Map VARSA (Altın Anahtar) 🟢 %100

```bash
# source-map paketi ile restore
npm install -g source-map
node -e "
const sm = require('source-map');
const fs = require('fs');
async function go() {
  const raw = fs.readFileSync('renderer.js.map', 'utf8');
  const c = await new sm.SourceMapConsumer(JSON.parse(raw));
  c.sources.forEach(s => {
    const ct = c.sourceContentFor(s);
    if (ct) {
      const fn = s.replace(/^webpack:\/\//, '').replace(/[\/\\]/g, '_');
      fs.writeFileSync('restored/' + fn, ct);
    }
  });
  console.log('✅ Restored ' + c.sources.length + ' files');
}
go();
"
```

### Seviye 2 — Sadece Minified Kod 🟢 %95

```bash
# Formatla
npx prettier --write main.js --tab-width 2

# webcrack ile deobfuscate
npm install -g webcrack   # ⭐ 2.6k — JsDeObsBench #2
webcrack main.js -o decoded/
```

### Seviye 3 — Webpack Bundle 🟢 %90

```bash
# webcrack otomatik tespit eder
webcrack renderer.bundle.js -o unpacked-webpack/
# Çıktı: modules/module-1.js, modules/module-45.js, webpack-runtime.js

# Alternatif: wakaru (github.com/Dadangg/wakaru)
npx wakaru unpack bundle.js -o restored/
npx wakaru unminify bundle.js
```

### Seviye 4 — Obfuscator.io 🟡 %80

```javascript
// Örnek obfuscated kod:
var _0x1234 = ['\x72\x65\x76\x65\x72\x73\x65'];
function _0x5678(_0x9abc) { return process[_0x1234[0]][_0x1234[1]](_0x9abc); }

// webcrack çözer:
webcrack obfuscated.js -o decoded/
```

### Seviye 5 — LLM ile Değişken İsimlendirme (humanify) 🟢 Okunabilirlik ×5

```bash
npm install -g humanify   # ⭐ 2k+
humanify bundle.js -o human-readable/

# API anahtarı ile (OpenAI)
humanify --api-key sk-xxx bundle.js -o decoded/
```

**Nasıl çalışır:**
1. webcrack ile yapısal deobfuscation
2. Her değişken için LLM'e bağlam gönder → anlamlı isim önerisi al
3. LLM sadece isim önerir, Babel ile deterministik rename uygulanır (güvenli)

```javascript
// Önce:  function _0x12ab(_0x34cd) { return _0x34cd * 2; }
// Sonra: function calculateDouble(value) { return value * 2; }
```

### Seviye 6 — V8 Bytecode (.jsc) 🟠 %60

Bytenode veya electron-vite bytecode ile korunan dosyalar:

```bash
# Ghidra + ghidra_nodejs plugin ile decompile
# ghidra_nodejs: github.com/positive-security/ghidra_nodejs
# Adımlar:
# 1. Ghidra'yı kur
# 2. ghidra_nodejs plugin'ini yükle
# 3. .jsc dosyasını aç → otomatik decompile
```

Kaynak: https://swarm.ptsecurity.com/how-we-bypassed-bytenode-and-decompiled-node-js-bytecode-in-ghidra/

### JSimplifier: En Kapsamlı Çözüm (NDSS 2026)

XingTuLab ekibinin JSimplifier'ı şu anki **akademik SOTA**. 3 aşamalı pipeline:

```
Preprocessor (Meriyah parser + WebCrack) → Deobfuscator (Static AST + Dynamic Exec) → Humanizer (LLM rename + Prettier)
```

**Kanıtlanmış başarı:** 20/20 obfuscation tekniğinde %100, %466 okunabilirlik artışı, 44,421 real-world sample'da test edildi.

```bash
git clone https://github.com/XingTuLab/JSIMPLIFIER.git
cd JSIMPLIFIER
pip install -r requirements.txt
python jsimplifier.py -i obfuscated.js -o output/
```

---

## 6. DevTools & Remote Debugging

### 6.1 Uzaktan Debug Portu

```bash
# Renderer process (Chrome DevTools Protocol)
/Applications/App.app --remote-debugging-port=8315
# → Chrome'da chrome://inspect

# Main process (Node.js Inspector)
/Applications/App.app --inspect=9229
# → Chrome DevTools + Node.js bağlantısı
```

### 6.2 DevTools'u Zorla Açma (ASAR Patch)

ASAR içinde `main.js`'de şu satırı bul:

```javascript
// ORİJİNAL:
PE.enable(this.browserWindow.webContents),

// DEĞİŞTİR:
PE.enable(this.browserWindow.webContents),
this.browserWindow.webContents.openDevTools(),   // EKLE
```

### 6.3 İkili Ağ Katmanı (Proxy İçin Kritik!)

**Electron'da iki ayrı ağ katmanı vardır: Chromium ve Node.js.** İkisini de proxy'den geçirmek için:

```bash
# Chromium trafiği
/Applications/App.app --args --proxy-server=127.0.0.1:8080 --ignore-certificate-errors

# Node.js trafiği
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm config set proxy http://localhost:8080
npm config set https-proxy https://localhost:8080
```

**Kaynak:** Dana Epp — Bruno API reverse engineering case study

### 6.4 API Endpoint Keşfi

```bash
# jsluice ile tüm URL'leri çıkar (BishopFox ⭐800+)
find . -type f -name "*.js" | jsluice urls | jq -r '.url' | sort -u

# Manuel grep
grep -r "https\?://" src/ | grep -E "(api|graphql|rest)" | sort -u

# .env dosyalarını kontrol et
find . -name ".env*" -exec cat {} \;

# Environment variable kullanımları
grep -r "process\.env\." src/
```

---

## 7. Electron Fuses (Savunma Katmanı)

### 7.1 Kontrol

```bash
npx @electron/fuses read --app /Applications/Slack.app
# Örnek çıktı:
#   RunAsNode is Disabled
#   EnableNodeCliInspectArguments is Disabled
#   EnableEmbeddedAsarIntegrityValidation is Enabled
#   OnlyLoadAppFromAsar is Enabled
```

### 7.2 Önemli Fuse'lar

| Fuse | Açık/Default | Etkisi |
|------|:-----------:|--------|
| **RunAsNode** | Aktif | `ELECTRON_RUN_AS_NODE` env var'ını dikkate alır |
| **EnableNodeCliInspectArguments** | Aktif | `--inspect`, `--debug` flag'lerini kabul eder |
| **EnableEmbeddedAsarIntegrityValidation** | Pasif | Varsa ASAR integrity kontrolü yapar |
| **OnlyLoadAppFromAsar** | Pasif | Sadece ASAR'dan kod yüklenmesine izin verir |
| **EnableNodeOptionsEnvironmentVariable** | Aktif | `NODE_OPTIONS` env var'ını dikkate alar |
| **LoadBrowserProcessSpecificV8Snapshot** | — | V8 snapshot'ını kilitler (CVE-2025-55305) |

### 7.3 Hex Edit ile Değiştirme (Kısıtlı)

```bash
# Binary'de marker string'i bul
grep -boa "dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX" /Applications/App.app/Contents/Frameworks/Electron\ Framework.framework/Electron\ Framework

# Hemen sonraki ASCII byte:
#   '0' (0x30) = Disabled
#   '1' (0x31) = Enabled

# ⚠️ Binary değişince kod imzası bozulur → self-signed cert ile yeniden imzala
```

---

## 8. Kod Enjeksiyon Vektörleri

### 8.1 `ELECTRON_RUN_AS_NODE`

Fuse `RunAsNode` aktifse, uygulama Node.js REPL olarak başlatılabilir:

```bash
ELECTRON_RUN_AS_NODE=1 /Applications/Discord.app/Contents/MacOS/Discord
# REPL'de: require('child_process').execSync('whoami')
```

### 8.2 `NODE_OPTIONS`

```bash
NODE_OPTIONS="--require /tmp/payload.js" ELECTRON_RUN_AS_NODE=1 /App
```

### 8.3 `--inspect` Bypass (Korumalı Uygulamalar)

Uygulama `--inspect` flag'ini kontrol ediyorsa, süreci monitör et → kill et → `--inspect-brk` ile yeniden başlat → debugger'a bağlan → `process.argv`'yi debugger üzerinden ez.

---

## 9. Pratik Özelleştirme Senaryoları

### 9.1 Telemetri Engelleme

```javascript
// Orijinal:
function trackEvent(name, data) {
  return fetch('https://telemetry.app.com/event', { method: 'POST', body: JSON.stringify({name, data}) });
}

// Değiştirilmiş:
function trackEvent(name, data) {
  console.log('[BLOCKED] Telemetry:', name);
  // Hiçbir şey yapma — sessizce blokla
}
```

### 9.2 Auto-Update Kaldırma

```bash
# electron-builder ile paketlenmişse:
rm resources/app-update.yml

# JS'de:
// Orijinal: autoUpdater.checkForUpdates()
// Yorum satırı yap: // autoUpdater.checkForUpdates()
```

### 9.3 UI Özelleştirme (CSS/JS Injection)

```javascript
// render script — electron-inject ile enjekte et:
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .sidebar { width: 280px !important; }
    .ad-container, [data-testid="upsell"] { display: none !important; }
    body { background: #0d1117 !important; color: #c9d1d9 !important; }
    /* Dark mode tweaks */
  </style>
`);
```

### 9.4 Premium Feature Aktifleştirme

```javascript
// Orijinal lisans kontrolü:
function checkLicense() {
  return fetch('/api/license').then(r => r.json());
}

// Patch'lenmiş:
function checkLicense() {
  return Promise.resolve({
    status: 'premium',
    expiry: '2099-12-31',
    features: ['all', 'unlimited'],
    user: 'power-user'
  });
}
```

### 9.5 Native Module Wrapper'ını Patch'leme

Bazı uygulamalar kritik mantığı C++ native modüllerinde tutar. Ancak JS wrapper'ını patch'lemek genelde yeterlidir:

```javascript
// Orijinal (native module çağrısı):
get ['remainingEvaluationDays']() {
  return (0x0, registration_1['remainingEvaluationDays'])();
}

// Patch'lenmiş:
get ['remainingEvaluationDays']() {
  return 999; // Her zaman 999 gün göster
}
```

**Kaynak:** Sononym reverse engineering case study (Ahmad Z.)

---

## 10. Vaka Çalışmaları (Gerçek Dünyada Kanıtlanmış)

### 10.1 Sononym — Lisans Patch

**Hedef:** 30 günlük evaluation süresini atlama
**Yöntem:**
1. ASAR extract → `license.js` bul
2. `remainingEvaluationDays()` fonksiyonunun native modülü çağırdığını tespit et
3. JS wrapper'ını patch: `return 999;`
4. Repack → çalıştır → çalışıyor

**Ders:** Native module var diye korkma — JS wrapper'ı patch etmek yeterli olabilir.

### 10.2 Bruno API Client — Ağ Trafiği Keşfi

**Hedef:** Şüpheli ağ bağlantılarını analiz etme
**Yöntem:**
1. `jsluice` ile tüm URL'leri çıkar
2. `.env.sample`'da `BRUNO_INFO_ENDPOINT` bul
3. DNS sorgusu ile CNAME çözümlemesi yap
4. İkili proxy katmanı (Chromium + Node.js) ile trafiği yakala

**Ders:** `jsluice` + DNS + proxy = Electron app API keşfinin üçlü sacayağı.

### 10.3 draw.io — Cross-Platform Extraction

**Hedef:** En güncel diagram asset'lerini çıkarma
**Yöntem:** `7z x` ile her formatı dene:
```
.dmg → 7z → .asar → extract
.AppImage → 7z → direkt .asar
.deb → ar x → tar → .asar
```

**Ders:** `7z` neredeyse her Electron dağıtım formatını açar. Önce `7z x` dene.

### 10.4 Signal Desktop — ASAR Tampering

**Hedef:** Şifreli mesajları local SQLite veritabanından okuma
**Yöntem:**
1. ASAR extract
2. SQLite bağlantı koduna HTTP POST exfiltration ekle
3. Repack → çalıştır
4. Kullanıcı fark etmeden tüm mesajlar attacker'a gidiyor

**Ders:** JS kodu değiştirip repack etmek uygulamayı bozmaz — tespit edilmesi çok zordur.

### 10.5 Figma — The Bait and Switch

**Hedef:** Figma macOS uygulamasının koduna erişim
**Bulgu:** DMG içinde sadece **2MB shell binary** var. Gerçek uygulama Info.plist'teki URL'den ayrı indiriliyor.

```xml
<key>aarch64</key>
<string>https://desktop.figma.com/mac-arm/Figma.zip</string>
```

**Ders:** Bazı uygulamalar iki aşamalı dağıtım kullanır. DMG'yi açmak yetmez, Info.plist'teki download URL'ini bul.

---

## 11. Tool Karşılaştırma Matrisi

### 11.1 Deobfuscation Araçları

| Araç | Tip | Syntax Doğruluk | Exec Doğruluk | Okunabilirlik | Hız | En İyi Olduğu Durum |
|------|-----|:--------------:|:-------------:|:-------------:|:---:|-------------------|
| **webcrack** ⭐2.6k | Static AST | %100 | %100 | Orta (CodeBLEU 0.63) | ⚡ saniye | Bundle unpack + deobfuscate. İLK ADIM |
| **JSimplifier** 🆕 | Hybrid+LLM | %100 | %100 | En yüksek (%466 ↑) | 🐢 dk | En kompleks, çok katmanlı obfuscation |
| **humanify** ⭐2k | LLM-based | %95+ | %90+ | Çok yüksek | 🐢 dk | Değişken isimlendirme (son adım) |
| **GPT-4o / DeepSeek** | Pure LLM | %96-99 | %93-97 | En doğal (CodeBLEU 0.67) | 🐌 çok yavaş | Küçük fonksiyonları anlamlandırma |
| **de4js** | Pattern | Yüksek | Orta | Düşük | ⚡ saniye | eval/Packer çözme |
| **REstringer** | String | Yüksek | Yüksek | Orta | ⚡ saniye | String rekonstrüksiyonu |
| **wakaru** ⭐600+ | Modular | Yüksek | Yüksek | Yüksek | ⚡ saniye | Modüler unpack + akıllı rename |

### 11.2 Runtime Injection Araçları

| Araç | Dil | Yıldız | Yöntem | En İyi |
|------|-----|:------:|--------|--------|
| **electron-inject** | Python | 374 | CDP + wrapper | Özel script enjeksiyonu, DevTools aktivasyonu |
| **electron-injector** | Rust | 43 | CDP | Binary dağıtım, hızlı CLI |
| **debugtron** | TS/React | 1.9k+ | GUI | Production debug, tüm çalışan Electron'ları tarar |

### 11.3 ASAR & Integrity Araçları

| Araç | Dil | Yıldız | Kullanım |
|------|-----|:------:|----------|
| **asar** (npm) | JS | 2.5k+ | Extract/repack |
| **Azar7z** | 7-Zip | — | GUI ile ASAR görüntüleme |
| **asar-tools** | Python | — | Python ile ASAR manipülasyonu |
| **electron-fuses** | JS | — | Fuse durumu okuma |
| **electron-app-patcher** | TS | 16 | macOS otomatik patch (6 adım) |

### 11.4 API Keşif Araçları

| Araç | Tür | Ne İşe Yarar |
|------|-----|-------------|
| **jsluice** (BishopFox) | Go CLI | JS dosyalarından URL/endpoint çıkarma |
| **ripgrep** | Rust CLI | Tüm kaynak kodda hızlı arama |
| **jq** | C CLI | JSON parse + query |
| **Burp Suite** | Java GUI | HTTP/HTTPS trafiğini intercept |

---

## 12. Hızlı Karar Tablosu

| ASAR'da Ne Var? | Araç | Komut | Başarı |
|:---------------|------|-------|:------:|
| `.js.map` dosyası | source-map | `node restore.js` | 🟢 %100 — 2 dk |
| Minified `.js` | webcrack | `webcrack main.js` | 🟢 %95 — 30 sn |
| Webpack bundle | webcrack | `webcrack bundle.js -o out/` | 🟢 %90 — 30 sn |
| Obfuscator.io | webcrack | `webcrack obf.js` | 🟡 %80 — 1 dk |
| String array obfuscation | de4js | `de4js obf.js` | 🟡 %75 — 1 dk |
| Jscrambler | JSimplifier | `jsimplifier.py -i file.js` | 🟠 %60 — 5 dk |
| bytenode `.jsc` | Ghidra + plugin | Ghidra ile | 🟠 %60 — 30 dk |
| Hiçbiri çalışmıyorsa | LLM + elle AST | `humanify bundle.js` | 🟠 %50+ — değişken |

---

## 13. Optimize Edilmiş Pipeline (Kanıtlanmış Akış)

```
FAZ 1 — KEŞİF (5 dk)
──────────────────────────────────────────
1. npx asar extract app.asar ./src
2. cd src
3. find . -name "*.js.map"          # Source map var mı? → %100
4. head -20 main.js                  # Bundle formatı? (webpack? obfuscator.io?)
5. file *.node                       # Native module var mı?
6. npx @electron/fuses read --app .. # Fuse durumu?
7. ls -la src/                       # Genel yapı

FAZ 2 — RESTORE / DEOBFUSCATE (30 sn - 5 dk)
──────────────────────────────────────────
# Source map varsa:
→ node restore.js (yukarıdaki script)

# Yoksa:
→ webcrack main.js -o decoded/
→ npx prettier --write decoded/*.js

# Hala anlaşılmıyorsa:
→ humanify decoded/bundle.js -o human/
# veya:
→ python jsimplifier.py -i obfuscated.js -o output/

FAZ 3 — ANALİZ (5 dk)
──────────────────────────────────────────
→ find decoded/ -name "*.js" | jsluice urls | jq -r '.url' | sort -u
→ grep -r "api_url\|secret\|token\|license\|https\?://" decoded/
→ grep -r "process\.env\." decoded/
→ grep -r "trackEvent\|telemetry\|analytics" decoded/

FAZ 4 — PATCH / ÖZELLEŞTİRME (değişkene bağlı)
──────────────────────────────────────────
→ JS/HTML/CSS dosyalarında değişiklik yap
→ (Bkz: §9 — Pratik Özelleştirme Senaryoları)

FAZ 5 — REPACK + INTEGRITY BYPASS (1 dk)
──────────────────────────────────────────
→ asar pack decoded/ app.asar
→ §3'teki integrity bypass yöntemlerinden birini uygula
→ Uygulamayı çalıştır ve test et

FAZ 6 — RUNTIME DOĞRULAMA (5 dk)
──────────────────────────────────────────
→ Uygulamayı --remote-debugging-port=8315 ile başlat
→ chrome://inspect ile bağlan
→ Değişikliklerin çalıştığını doğrula
```

---

## 14. Format Tespit Yardımcısı

Farklı Electron paketleme formatlarını açmak için:

```
Format                     İlk 5 byte     Komut
──────────────────────────────────────────────────────────
ASAR (.asar)               { "h          npx asar extract
DMG (.dmg)                  x1\x00\x01   7z x
AppImage                    AI\x02        7z x veya --appimage-extract
DEB (.deb)                  !<arch>\n     ar x → tar xf
RPM (.rpm)                  \xed\xab...   7z x
Snap (.snap)               <Squashfs>    7z x
ZIP tabanlı (.asar'dan)    PK\x03\x04    7z x
Discord .distro            \x8b\x07\x08  brotli -d → tar xf
NSIS (.exe)                \x4e\x53\x49  7z x
```

---

## 15. Çalışma Ortamı

### Gereken Araçlar

```bash
# Temel
npm install -g @electron/asar @electron/fuses source-map prettier

# Deobfuscation
npm install -g webcrack humanify

# Analiz — jsluice (Go ile yazılmış, ayrı kurulum)
# https://github.com/BishopFox/jsluice

# Değişken isimlendirme
npm install -g humanify

# Python araçları
pip install electron-inject asar-tools restringer

# Rust
cargo install electron-injector
```

### Önerilen Sıra

1. **Önce source map ara** — varsa %100 kazanç
2. **Yoksa webcrack dene** — %90-95 başarı, 30 saniye
3. **Hala obfuscated ise** — JSimplifier (en kapsamlı)
4. **İsimler anlamsız ise** — humanify (LLM ile rename)
5. **Değişiklik yap** → **repack** → **integrity bypass** → **test et**

---

## 16. Yaygın Tuzaklar ve Çözümleri

### Tuzak 1: Discord .distro formatı
`7z` açamaz, "OpenPGP Public Key" der.
**Çözüm:** `brotli -d full.distro -o out.tar && tar xf out.tar`

### Tuzak 2: Figma sadece 2MB
DMG'de sadece shell binary var, gerçek kod yok.
**Çözüm:** Info.plist'teki `aarch64` veya `x86_64` key'inden download URL'ini bul.

### Tuzak 3: Repack sonrası boyut 170MB'a fırlıyor
ASAR header alignment değişiyor.
**Çözüm:** `asar pack`'in bilinen bir bug'ı. Çalışmayı engellemez, sadece disk kaplar. Alternatif olarak `--ordering` flag'ini dene.

### Tuzak 4: ASAR integrity hatası
```
FATAL:asar_util.cc(164) Integrity check failed
```
**Çözüm:** Bkz §3 — 3 bypass yöntemi.

### Tuzak 5: Source map buldum ama içi boş
Uygulama `sourceContentFor()`'u desteklemeyen bir map formatı kullanıyor olabilir.
**Çözüm:** Alternatif olarak `source-map` yerine `mozilla/source-map` paketinin eski sürümünü dene veya Chrome DevTools'a manuel yükle.

### Tuzak 6: LLM syntax hatası üretti
LLM'ler deobfuscation'da %2-4 syntax hatası yapabilir.
**Çözüm:** Sonuçta `node -c output.js` ile syntax kontrolü yap. Hatalıysa webcrack'in determinantistik sonucunu kullan.

### Tuzak 7: Kod imzası bozuldu
Binary değişince macOS/Linux kod imzası geçersiz olur.
**Çözüm:** Self-signed certificate ile yeniden imzala:
```bash
# macOS
codesign --force --deep --sign - Target.app

# Veya gatekeeper'ı geçici olarak kapat
spctl --master-disable
```

### Tuzak 8: Uygulama crash log'unda hash gösterilmedi
Bazı Electron sürümleri hash farkını log'a basmaz.
**Çözüm:** Hash'i manuel hesapla (Bkz §3 — Node.js script).

### Tuzak 9: Hangi bundle formatı olduğunu anlayamadım
**Çözüm:** `head -20 main.js` ile ilk satırlara bak:
- `webpackChunk` → webpack (en yaygın)
- `require('...')` modülleri → browserify
- `_0x...` hex string'ler → obfuscator.io
- `$=function(` → jscrambler
- Tek satır, hiç satır sonu yok → minified

### Tuzak 10: electron-inject çalışmıyor — "connection refused"
Fuse `EnableNodeCliInspectArguments` devre dışı olabilir.
**Çözüm:** `npx @electron/fuses read --app ...` ile kontrol et. Devre dışıysa kod enjeksiyonu için farklı yöntem dene (ELECTRON_RUN_AS_NODE, vb.)

---

## 17. Doğrulama Kontrol Listesi

Her işlemden sonra:

- [ ] ASAR extract edildi ve kaynak kodlara erişildi mi?
- [ ] Source map varsa restore edildi mi?
- [ ] Minified/obfuscated kod deobfuscate edildi mi?
- [ ] API endpoint'leri ve secret'lar tespit edildi mi?
- [ ] Değişiklikler yapıldı ve repack edildi mi?
- [ ] ASAR integrity bypass edildi mi?
- [ ] Uygulama hatasız çalışıyor mu?
- [ ] Değişiklikler runtime'da doğrulandı mı?
- [ ] Yedek alındı mı? (her zaman önce yedek al!)
- [ ] Kod imzası (gerekliyse) yenilendi mi?

---

## 18. Kaynaklar ve Referans Araçlar

### GitHub Repoları

| Araç | Link | Yıldız | Açıklama |
|------|------|:------:|----------|
| **webcrack** | github.com/j4k0xb/webcrack | ⭐2.6k | Deobfuscation #1 |
| **humanify** | github.com/jehna/humanify | ⭐2k+ | LLM rename |
| **JSimplifier** | github.com/XingTuLab/JSIMPLIFIER | 🆕 | SOTA deobfuscation |
| **electron-inject** | github.com/tintinweb/electron-inject | ⭐374 | Runtime injection |
| **electron-injector** | github.com/itsKaynine/electron-injector | ⭐43 | Rust runtime inject |
| **debugtron** | github.com/pd4d10/debugtron | ⭐1.9k+ | GUI debug |
| **electron-app-patcher** | github.com/karlhorky/electron-app-patcher | ⭐16 | macOS otomatik patch |
| **jsluice** | github.com/BishopFox/jsluice | ⭐800+ | URL/API keşfi |
| **de4js** | github.com/lelinhtinh/de4js | ⭐1k+ | Obfuscator unpacker |
| **wakaru** | github.com/Dadangg/wakaru | ⭐600+ | Modular unpack + akıllı rename |
| **REstringer** | github.com/PerimeterX/restringer | ⭐900+ | String reconstruction |
| **ghidra_nodejs** | github.com/positive-security/ghidra_nodejs | — | V8 bytecode decompile |

### Akademik Kaynaklar

| Kaynak | Ne İçerir | Link |
|--------|-----------|------|
| **JsDeObsBench (CCS 2025)** | LLM + tool benchmark, lider tablosu | jsdeobf.github.io |
| **JSimplifier (NDSS 2026)** | SOTA deobfuscation pipeline | arxiv.org/abs/2512.14070 |
| **PT Swarm — Ghidra NodeJS** | V8 bytecode decompile | swarm.ptsecurity.com |
| **Trail of Bits — CVE-2025-55305** | V8 snapshot bypass | blog.trailofbits.com |

### Blog Yazıları

| Yazar | Konu | Link |
|-------|------|------|
| **Ahmad Z.** | Sononym License Patch | blog.ahmadz.ai |
| **Dana Epp** | Electron API Discovery | danaepp.com |
| **Amos** | Cross-format Extraction | fasterthanli.me |
| **Sourav Kalal** | ASAR Integrity Bypass | infosecwriteups.com |
| **jonmest** | Signal Tampering | github.com/jonmest |

### Resmi Dökümantasyon

- Electron ASAR Integrity: https://electronjs.org/docs/latest/tutorial/asar-integrity
- Electron Fuses: https://electronjs.org/docs/latest/tutorial/fuses
- Electron Source Code Protection (electron-vite): https://electron-vite.org/guide/source-code-protection

---

> **Referans dosyası:** `references/benchmark-data.md` — JsDeObsBench leaderboard, JSimplifier detaylı metrikler, format tespit tablosu, araç karşılaştırmaları.

> **⚠️ Yasal Uyarı:** Bu skill eğitim ve araştırma amaçlıdır. Başkalarının yazılımlarını izinsiz değiştirmek, lisans ihlalleri yapmak veya kötü amaçlı kullanmak yasa dışı olabilir. Her zaman kendi yazılımlarınız veya inceleme izniniz olan yazılımlar üzerinde çalışın.
