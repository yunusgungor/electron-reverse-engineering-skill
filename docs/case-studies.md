---
layout: default
title: Vaka Çalışmaları
---

# 🧠 Gerçek Dünya Vaka Çalışmaları

## 1. Sononym — Lisans Patch

**Hedef:** 30 günlük evaluation süresini atlama

**Kaynak:** [Ahmad Z.](https://blog.ahmadz.ai/cracking-sononym-license-evaluation-trial/)

**Adımlar:**
1. ASAR extract → `license.js` bul
2. `remainingEvaluationDays()` native module çağırıyor
3. JS wrapper'ını patch: `return 999;`
4. Repack → çalışıyor

**Ders:** Native module var diye korkma — JS wrapper'ı patch yeterli.

---

## 2. Bruno API — Ağ Trafiği Keşfi

**Hedef:** Şüpheli ağ bağlantılarını analiz

**Kaynak:** [Dana Epp](https://danaepp.com/reverse-engineering-electron-apps-to-discover-apis)

**Yöntem:**
- `jsluice` ile URL çıkarma
- `.env.sample`'dan `BRUNO_INFO_ENDPOINT` bulma
- DNS CNAME çözümlemesi
- İkili proxy katmanı (Chromium + Node.js)

**Ders:** `jsluice` + DNS + proxy = API keşfinin üçlü sacayağı.

---

## 3. draw.io — Cross-Platform Extraction

**Hedef:** En güncel diagram asset'lerini çıkarma

**Kaynak:** [Amos (fasterthanli.me)](https://fasterthanli.me/articles/cracking-electron-apps-open)

**Yöntem:** `7z x` ile her formatı dene:

| Format | Komut |
|--------|-------|
| .dmg | `7z x` → .asar |
| .AppImage | `7z x` → direkt .asar |
| .deb | `ar x` → `tar` → .asar |
| Discord .distro | `brotli -d` → `tar` |

**Ders:** `7z` neredeyse her formatı açar.

---

## 4. Signal Desktop — ASAR Tampering

**Hedef:** Şifreli mesajları local SQLite'den okuma

**Kaynak:** [jonmest](https://github.com/jonmest/How-To-Tamper-With-Any-Electron-Application)

**Yöntem:**
1. ASAR extract
2. SQLite koduna HTTP POST exfiltration ekle
3. Repack → çalıştır
4. Kullanıcı fark etmiyor

**Ders:** JS değiştirip repack etmek tespit edilmesi çok zor.

---

## 5. Figma — The Bait and Switch

**Hedef:** Figma macOS koduna erişim

**Kaynak:** [Amos (fasterthanli.me)](https://fasterthanli.me/articles/cracking-electron-apps-open)

**Bulgu:** DMG'de sadece **2MB shell binary**. Gerçek kod ayrı:

```xml
<key>aarch64</key>
<string>https://desktop.figma.com/mac-arm/Figma.zip</string>
```

**Ders:** İki aşamalı dağıtım — DMG yetmez, Info.plist'teki URL'i bul.

---

👉 [Ana Skill §10](../skill/SKILL.md#10-vaka-%C3%A7al%C4%B1%C5%9Fmalar%C4%B1-ger%C3%A7ek-d%C3%BCnyada-kan%C4%B1tlanm%C4%B1%C5%9F)
