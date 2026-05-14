---
layout: default
title: Benchmark Verileri
---

# 📊 Deobfuscation Benchmark & Comparison Data

## JsDeObsBench Leaderboard (CCS 2025)

**Kaynak:** https://jsdeobf.github.io/ | arXiv:2506.20170
**Veriseti:** 36,260 obfuscated JS programı, 7 transformation type

| # | Model/Tool | Syntax % | Exec % | CodeBLEU | Overall |
|:-:|-----------|:--------:|:------:|:--------:|:-------:|
| 🥇 | **DeepSeek-Chat** | 98.74 | **96.69** | 68.55 | **75.17** |
| 🥈 | **webcrack** 🎓 | **100.00** | **100.00** | 62.79 | 73.99 |
| 🥉 | **GPT-4o** | 95.99 | 93.42 | **67.02** | 73.67 |
| 4 | Codestral-22B 🎓 | 99.00 | 84.16 | 60.96 | 70.02 |
| 5 | Synchrony 🎓 | 100.00 | 83.55 | 59.42 | 66.28 |
| 6 | DeepSeek-Coder-V2 | 99.06 | 64.25 | 55.27 | 61.32 |

🎓 = Expert tool

## JSimplifier (NDSS 2026 — Academic SOTA)

**Kaynak:** arXiv:2512.14070 | github.com/XingTuLab/JSIMPLIFIER

| Metric | JSimplifier | Best Competitor | Avantaj |
|--------|:-----------:|:---------------:|:-------:|
| Coverage (20/20) | **100%** | 80% | +20% |
| Complexity reduction | **0.8820 HLR** | 0.7889 | +12% |
| Readability ↑ | **466.94%** | 201% | **2.3×** |
| CFG similarity | **93.78%** | 85.12% | +9% |

## Use Case → Best Tool

| Use Case | Best Tool | Reason |
|----------|-----------|--------|
| Bundle unpack | **webcrack** | Auto-detect, 100% safe |
| Obfuscator.io | **webcrack** | First-class support |
| Multi-layer obfuscation | **JSimplifier** | Static+Dynamic hybrid |
| Variable rename | **humanify** | LLM-based, deterministic |
| String reconstruction | **REstringer** | Specialized patterns |
| eval/Packer | **de4js** | Fast pattern matching |
| V8 bytecode | **ghidra_nodejs** | Only option |

---

👉 [Ana Skill §11](../skill/SKILL.md#11-tool-kar%C5%9F%C4%B1la%C5%9Ft%C4%B1rma-matrisi)
