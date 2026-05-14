# Contributing to Electron Reverse Engineering Skill

Pull request'lerinizi bekliyoruz!

## 📐 Repo Yapısı

```
electron-reverse-engineering-skill/
├── skill/
│   ├── SKILL.md                  # Ana skill dosyası
│   └── references/
│       └── benchmark-data.md     # Benchmark verileri
├── docs/                          # Ek dökümantasyon
├── assets/                        # Görsel/medya dosyaları
├── examples/                      # Örnek scriptler
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

## 🧪 Nasıl Katkıda Bulunurum?

1. **Hata buldun mu?** [Issue aç](https://github.com/yunusgungor/electron-reverse-engineering-skill/issues/new)
2. **Eksik yöntem mi var?** PR gönder
3. **Yeni vaka çalışması mı keşfettin?** `examples/` altına ekle
4. **Tool benchmark güncellemesi mi var?** `references/benchmark-data.md`'yi güncelle

## ✅ Kalite Standartları

- SKILL.md frontmatter'ı geçerli olmalı (validator: `tools/skill_manager_tool.py`)
- Tüm kod blokları çalıştırılabilir olmalı
- Cross-reference'lar tutarlı olmalı
- Yeni eklenen bölümler için vaka çalışması referansı eklenmeli
