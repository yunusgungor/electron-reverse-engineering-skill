# Electron Reverse Engineering Skill

> **⚠️ Yasal Uyarı:** Bu skill eğitim ve araştırma amaçlıdır. Başkalarının yazılımlarını izinsiz değiştirmek, lisans ihlalleri yapmak veya kötü amaçlı kullanmak yasa dışı olabilir. Her zaman kendi yazılımlarınız veya inceleme izniniz olan yazılımlar üzerinde çalışın.

## Skill olarak kullanma

Bu skill **Hermes Agent** ile kullanılmak üzere tasarlanmıştır.

### Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/yunusgungor/electron-reverse-engineering-skill.git

# 2. Hermes skills dizinine sembolik link ver
mkdir -p ~/.hermes/skills
ln -s $(pwd)/electron-reverse-engineering-skill/skill ~/.hermes/skills/software-development/electron-reverse-engineering

# 3. Yeni bir Hermes oturumu başlatınca skill otomatik yüklenir
```

### Trigger'lar

Skill şu ifadelerle tetiklenir:
- "electron app reverse engineering"
- "asar extract"
- "electron deobfuscate"
- "electron app customize"
- "electron patch"
- "electron source code recovery"
- "electron internals"

## Bağımsız döküman olarak kullanma

`skill/SKILL.md` dosyasını herhangi bir markdown okuyucuda açarak tüm yöntemlere erişebilirsiniz.
