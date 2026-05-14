# 🔬 Electron Reverse Engineering Skill

**Electron tabanlı masaüstü uygulamalarının tersine mühendislik yoluyla incelenmesi, özelleştirilmesi ve güncellenmesi için kapsamlı, kanıtlanmış yöntemler bütünü.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/yunusgungor/electron-reverse-engineering-skill)](https://github.com/yunusgungor/electron-reverse-engineering-skill/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 Ne İşe Yarar?

Bu skill, kapalı kaynak Electron uygulamalarını anlamak, özelleştirmek ve ilham almak için gereken **tüm teknikleri adım adım** kapsar:

| Amaç | Ne Yapılır? |
|------|------------|
| **Kaynak Kod İnceleme** | ASAR arşivini aç, minified/obfuscated kodu deobfuscate et, API endpoint'lerini keşfet |
| **Özelleştirme** | Telemetriyi kapat, auto-update'i kaldır, UI'ı değiştir, premium feature'ları aktive et |
| **İlham Alma** | Rakip/benzer uygulamaların kod yapısını, API mimarisini, güvenlik katmanlarını incele |
| **Güvenlik Denetimi** | Şüpheli ağ bağlantılarını, hardcoded secret'ları, veri sızıntılarını tespit et |
| **Patch** | Lisans kontrollerini bypas et, native module wrapper'larını patch'le |

---

## 📚 İçindekiler

| # | Bölüm | Açıklama |
|:-:|-------|----------|
| 1 | [Ne Zaman Kullanılır](skill/SKILL.md#1-ne-zaman-kullan%C4%B1l%C4%B1r) | Hangi durumda hangi tekniğin kullanılacağı |
| 2 | [ASAR Manipülasyonu](skill/SKILL.md#2-asar-manip%C3%BClasyonu-temel-ad%C4%B1m) | ASAR bulma, extract, repack |
| 3 | [ASAR Integrity Baypas](skill/SKILL.md#3-asar-integrity-baypas-3-kan%C4%B1tlanm%C4%B1%C5%9F-y%C3%B6ntem) | 3 farklı bypass yöntemi + V8 snapshot |
| 4 | [Runtime Injection](skill/SKILL.md#4-runtime-injection-%C3%A7al%C4%B1%C5%9Fma-an%C4%B1nda-kod-enjeksiyonu) | 4 yöntemle çalışma anında kod enjeksiyonu |
| 5 | [Kaynak Kod Deobfuscation](skill/SKILL.md#5-kaynak-kod-deobfuscation-6-seviyeli-pipeline) | 6 seviyeli pipeline (source map → V8 bytecode) |
| 6 | [DevTools & Remote Debugging](skill/SKILL.md#6-devtools--remote-debugging) | Debug portu, ikili proxy katmanı, API keşfi |
| 7 | [Electron Fuses](skill/SKILL.md#7-electron-fuses-savunma-katman%C4%B1) | Fuse kontrolü, hex edit bypass |
| 8 | [Kod Enjeksiyon Vektörleri](skill/SKILL.md#8-kod-enjeksiyon-vekt%C3%B6rleri) | RUN_AS_NODE, NODE_OPTIONS, --inspect bypass |
| 9 | [Pratik Özelleştirme Senaryoları](skill/SKILL.md#9-pratik-%C3%B6zelle%C5%9Ftirme-senaryolar%C4%B1) | 5 gerçek senaryo |
| 10 | [Vaka Çalışmaları](skill/SKILL.md#10-vaka-%C3%A7al%C4%B1%C5%9Fmalar%C4%B1-ger%C3%A7ek-d%C3%BCnyada-kan%C4%B1tlanm%C4%B1%C5%9F) | 5 gerçek dünya vaka çalışması |
| 11 | [Tool Karşılaştırma Matrisi](skill/SKILL.md#11-tool-kar%C5%9F%C4%B1la%C5%9Ft%C4%B1rma-matrisi) | 15+ araç metrik bazlı karşılaştırma |
| 12 | [Hızlı Karar Tablosu](skill/SKILL.md#12-h%C4%B1zl%C4%B1-karar-tablosu) | ASAR'da ne var → hangi araç → başarı oranı |
| 13 | [Optimize Edilmiş Pipeline](skill/SKILL.md#13-optimize-edilmi%C5%9F-pipeline-kan%C4%B1tlanm%C4%B1%C5%9F-ak%C4%B1%C5%9F) | 6 fazlı kanıtlanmış akış |
| 14 | [Format Tespit Yardımcısı](skill/SKILL.md#14-format-tespit-yard%C4%B1mc%C4%B1s%C4%B1) | 9 farklı Electron formatını tanıma |
| 15 | [Çalışma Ortamı](skill/SKILL.md#15-%C3%A7al%C4%B1%C5%9Fma-ortam%C4%B1) | Gereken araçlar, kurulum |
| 16 | [Yaygın Tuzaklar](skill/SKILL.md#16-yayg%C4%B1n-tuzaklar-ve-%C3%A7%C3%B6z%C3%BCmleri) | 10 tuzak ve çözümü |
| 17 | [Doğrulama Kontrol Listesi](skill/SKILL.md#17-do%C4%9Frulama-kontrol-listesi) | 10 maddelik checklist |
| 18 | [Kaynaklar](skill/SKILL.md#18-kaynaklar-ve-referans-ara%C3%A7lar) | GitHub repoları, akademik yayınlar, blog yazıları |

---

## 🚀 Hızlı Başlangıç

```bash
# Önce ASAR'ı extract et
npx @electron/asar extract app.asar ./src

# Source map var mı kontrol et
find ./src -name "*.js.map"

# webcrack ile deobfuscate et
npm install -g webcrack
webcrack src/main.js -o decoded/

# Değişiklik yap → repack
asar pack decoded/ app.asar
```

Detaylı adımlar için: [`skill/SKILL.md`](skill/SKILL.md)

---

## 📊 Akademik Referanslar

Bu skill'deki yöntemler aşağıdaki akademik çalışmalarla kanıtlanmıştır:

| Çalışma | Konferans | Link |
|---------|-----------|------|
| **JsDeObsBench** | CCS 2025 | [arxiv.org/abs/2506.20170](https://arxiv.org/abs/2506.20170) |
| **JSimplifier** | NDSS 2026 | [arxiv.org/abs/2512.14070](https://arxiv.org/abs/2512.14070) |
| **CVE-2025-55305** | Trail of Bits | [blog.trailofbits.com](https://blog.trailofbits.com/2025/09/03/) |

Benchmark detayları: [`skill/references/benchmark-data.md`](skill/references/benchmark-data.md)

---

## 🛠️ Gereken Araçlar

```bash
# Temel
npm install -g @electron/asar @electron/fuses source-map prettier

# Deobfuscation
npm install -g webcrack humanify

# Python araçları
pip install electron-inject asar-tools restringer

# API Keşfi
# jsluice: https://github.com/BishopFox/jsluice

# Rust (opsiyonel)
cargo install electron-injector
```

---

## 🧠 Gerçek Dünya Vaka Çalışmaları

| Uygulama | Ne Yapıldı? | Ders |
|----------|------------|------|
| **Sononym** | 30 günlük evaluation süresi bypass → JS wrapper patch | Native module var diye korkma |
| **Bruno API** | Şüpheli ağ bağlantıları analizi → API endpoint keşfi | jsluice + DNS + proxy = 3'lü sacayağı |
| **draw.io** | Cross-platform asset extraction | `7z` her formatı açar |
| **Signal** | SQLite plaintext message exfiltration | ASAR tampering fark edilmez |
| **Figma** | DMG'de shell binary → gerçek kod ayrı | İki aşamalı dağıtımı fark et |

---

## ⚖️ Yasal Uyarı

Bu skill **eğitim ve araştırma amaçlıdır**. Başkalarının yazılımlarını izinsiz değiştirmek, lisans ihlalleri yapmak veya kötü amaçlı kullanmak yasa dışı olabilir. Her zaman kendi yazılımlarınız veya inceleme izniniz olan yazılımlar üzerinde çalışın.

---

## 🤝 Katkı

Katkılarınızı bekliyoruz! Lütfen [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını inceleyin.

## 📝 Lisans

MIT License — Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👤 Yazar

**Yunus Güngör** — [github.com/yunusgungor](https://github.com/yunusgungor)

---

*Bu skill, kapsamlı web araştırması, akademik benchmark'lar (JsDeObsBench/CCS 2025, JSimplifier/NDSS 2026) ve gerçek dünya vaka çalışmaları (fasterthanli.me, danaepp.com, jonmest, Ahmad Z.) temel alınarak hazırlanmıştır.*
