---
layout: default
title: Tool Karşılaştırma
---

# 🛠️ Tool Karşılaştırması

## Deobfuscation Araçları

| Araç | ⭐ | Tür | Syntax % | Exec % | Hız | En İyi Olduğu Durum |
|------|:-:|:---:|:--------:|:------:|:---:|-------------------|
| **webcrack** | 2.6k | Static AST | **100** | **100** | ⚡ sn | Bundle unpack + deobfuscate. İLK ADIM |
| **JSimplifier** 🆕 | — | Hybrid+LLM | **100** | **100** | 🐢 dk | Multi-layer obfuscation |
| **humanify** | 2k+ | LLM-based | 95+ | 90+ | 🐢 dk | Variable rename |
| **GPT-4o** | — | Pure LLM | 96 | 93 | 🐌 yvş | Snippet analizi |
| **de4js** | 1k+ | Pattern | Yüksek | Orta | ⚡ sn | eval/Packer çözme |
| **wakaru** | 600+ | Modular | Yüksek | Yüksek | ⚡ sn | Modular unpack |

## Runtime Injection Araçları

| Araç | Dil | ⭐ | Yöntem |
|------|-----|:--:|--------|
| **electron-inject** | Python | 374 | CDP + DevTools aktivasyonu |
| **electron-injector** | Rust | 43 | CDP binary CLI |
| **debugtron** | TS/React | 1.9k+ | GUI production debug |

## ASAR & Integrity Araçları

| Araç | ⭐ | Kullanım |
|------|:--:|----------|
| **@electron/asar** | 2.5k+ | Extract/repack |
| **Azar7z** | — | GUI ASAR viewer |
| **asar-tools** (Python) | — | Python ASAR manipulation |
| **@electron/fuses** | — | Fuse durumu okuma |
| **electron-app-patcher** | 16 | macOS otomatik patch |

## API Keşif Araçları

| Araç | Tür | Ne İşe Yarar |
|------|-----|-------------|
| **jsluice** (BishopFox) | Go CLI | JS'den URL/endpoint çıkarma |
| **ripgrep** (rg) | Rust CLI | Hızlı kod arama |
| **jq** | C CLI | JSON parse |
| **Burp Suite** | Java GUI | HTTP/HTTPS intercept |

---

**Önerilen kombinasyon:** webcrack → JSimplifier → humanify

Detaylar: [Ana Skill §11](../skill/SKILL.md#11-tool-kar%C5%9F%C4%B1la%C5%9Ft%C4%B1rma-matrisi)
