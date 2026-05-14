---
layout: default
title: Yaygın Tuzaklar
---

# ⚠️ Yaygın Tuzaklar ve Çözümleri

## 🔴 Tuzak 1: Discord .distro formatı

**Sorun:** `7z` açamaz, "OpenPGP Public Key" der.

**Çözüm:**
```bash
brotli -d full.distro -o out.tar && tar xf out.tar
```

## 🔴 Tuzak 2: Figma sadece 2MB

**Sorun:** DMG'de sadece shell binary var, gerçek kod yok.

**Çözüm:** Info.plist'teki `aarch64` veya `x86_64` key'inden download URL'ini bul.

## 🔴 Tuzak 3: Repack sonrası boyut fırlıyor

**Sorun:** ASAR header alignment değişiyor, boyut 170MB'a çıkıyor.

**Çözüm:** `asar pack`'in bilinen bug'ı. Çalışmayı engellemez.

## 🔴 Tuzak 4: ASAR integrity hatası

**Sorun:**
```
FATAL:asar_util.cc(164) Integrity check failed
```

**Çözüm:** 3 bypass yöntemi:
- macOS: Info.plist hash update
- Win/Linux: Binary'de sed
- Otomatik: electron-app-patcher

## 🔴 Tuzak 5: Source map içi boş

**Sorun:** `sourceContentFor()` boş dönüyor.

**Çözüm:** Chrome DevTools'a manuel yükle veya eski `mozilla/source-map` paketini dene.

## 🔴 Tuzak 6: LLM syntax hatası

**Sorun:** LLM %2-4 syntax hatası yapabilir.

**Çözüm:**
```bash
node -c output.js   # Syntax kontrol
```
Hatalıysa webcrack'in determinantistik sonucunu kullan.

## 🔴 Tuzak 7: Kod imzası bozuldu

**Sorun:** Binary değişince macOS/Linux imza geçersiz.

**Çözüm:**
```bash
# macOS
codesign --force --deep --sign - Target.app
```

## 🔴 Tuzak 8: Hash log'da gösterilmedi

**Sorun:** Bazı Electron sürümleri hash farkını log'a basmaz.

**Çözüm:** Manuel hesapla (Bkz: Node.js script ile)

## 🔴 Tuzak 9: Format anlaşılamadı

**Sorun:** Hangi bundle formatı olduğu belli değil.

**Çözüm:** `head -20 main.js` ile bak:
- `webpackChunk` → webpack
- `require(...)` → browserify
- `_0x...` → obfuscator.io
- `$=function(` → jscrambler
- Tek satır → minified

## 🔴 Tuzak 10: electron-inject çalışmıyor

**Sorun:** "connection refused" hatası.

**Çözüm:** Fuse durumunu kontrol et:
```bash
npx @electron/fuses read --app /App
```
`EnableNodeCliInspectArguments` devre dışıysa farklı yöntem dene.

---

👉 [Ana Skill §16](../skill/SKILL.md#16-yayg%C4%B1n-tuzaklar-ve-%C3%A7%C3%B6z%C3%BCmleri)
