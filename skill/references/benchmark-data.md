# Deobfuscation Benchmark & Comparison Data

> Quick-reference for agent use. Full methodology in the linked papers.

---

## JsDeObsBench Leaderboard (CCS 2025)

**Source:** https://jsdeobf.github.io/ | arXiv:2506.20170
**Dataset:** 36,260 obfuscated JS programs, 7 transformation types
**Metrics:** Syntax Correctness, Execution Correctness, Simplification, Similarity (CodeBLEU)

| # | Model/Tool | Syntax % | Exec % | Simplification | CodeBLEU | Overall |
|---|---|---|---|---|---|---|
| 🥇 | **DeepSeek-Chat (2025-03-01)** | 98.74 | **96.69** | 36.70 | 68.55 | **75.17** |
| 🥈 | **webcrack** 🎓 | **100.00** | **100.00** | 33.19 | 62.79 | 73.99 |
| 🥉 | **GPT-4o** | 95.99 | 93.42 | **38.25** | **67.02** | 73.67 |
| 4 | Codestral-22B-v0.1 🎓 | 99.00 | 84.16 | 35.96 | 60.96 | 70.02 |
| 5 | Synchrony 🎓 | 100.00 | 83.55 | 22.14 | 59.42 | 66.28 |
| 6 | DeepSeek-Coder-V2 | 99.06 | 64.25 | 26.71 | 55.27 | 61.32 |
| 7 | Llama-3.1 (8B) | 93.52 | 43.73 | 19.74 | 49.23 | 51.55 |

🎓 = Expert tool (designed for JS deobfuscation)

### Key Takeaways

- **webcrack is the safest:** 100% syntax + execution guarantees. No LLM hallucination risk.
- **GPT-4o is the most readable:** Best CodeBLEU (0.67). Use for renaming after webcrack.
- **LLM failure mode:** Average 2.76% syntax error rate. Always validate with `node -c`.
- **Hardest technique for LLMs:** String obfuscation.

---

## JSimplifier (NDSS 2026 — Academic SOTA)

**Source:** arXiv:2512.14070 | github.com/XingTuLab/JSIMPLIFIER
**Pipeline:** Preprocessor → Deobfuscator → Humanizer

### Proven Results vs Competitors

| Metric | JSimplifier | Best Competitor | Advantage |
|--------|:-----------:|:---------------:|:---------:|
| Tech coverage (20/20) | **100%** | 80% | +20% |
| Code complexity reduction (HLR) | **0.8820** | 0.7889 | +12% |
| Readability improvement | **466.94%** | 201% | **2.3×** |
| CFG similarity (semantics) | **93.78%** | 85.12% | +9% |
| Dataset coverage (44,421 samples) | **100%** | — | — |

---

## Tool Comparison by Use Case

| Use Case | Best Tool | Reason |
|----------|-----------|--------|
| Bundle unpack (webpack/browserify) | **webcrack** | Auto-detect, 100% safe |
| Obfuscator.io deobfuscation | **webcrack** | First-class support |
| Multi-layer complex obfuscation | **JSimplifier** | Hybrid static+dynamic |
| Variable/function rename | **humanify** | LLM-based, deterministic AST |
| String array reconstruction | **REstringer** | Specialized for string patterns |
| eval/Packer unpacking | **de4js** | Fast pattern matching |
| V8 bytecode (.jsc) decompile | **ghidra_nodejs** | Only option |

---

## Format Detection Quick Reference

```
First 5 bytes / signature    → Format           → Extract command
─────────────────────────────────────────────────────────────────
{ "h                        → ASAR (.asar)     → npx asar extract
\x78\x01\x00\x01            → DMG              → 7z x
AI\x02                      → AppImage         → 7z x or --appimage-extract
!<arch>\n                   → DEB (.deb)       → ar x → tar xf
PK\x03\x04                  → ZIP              → 7z x
Squashfs signature          → Snap (.snap)     → 7z x
Discord .distro magic       → Discord .distro  → brotli -d → tar xf
NSIS magic                  → NSIS (.exe)      → 7z x
```

---

## References

- [SKILL.md](../SKILL.md) — Main skill document
- JsDeObsBench: jsdeobf.github.io | arXiv:2506.20170
- JSimplifier: github.com/XingTuLab/JSIMPLIFIER | arXiv:2512.14070
- PT Swarm Ghidra NodeJS: swarm.ptsecurity.com
- Trail of Bits CVE-2025-55305: blog.trailofbits.com
