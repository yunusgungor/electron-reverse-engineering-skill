# 📋 Electron Reverse Engineering — Tool Kurulum Scripti

```bash
#!/bin/bash
# Bu script Electron tersine mühendislik için gereken tüm araçları kurar.
# Desteklenen: Linux/macOS (Windows için WSL önerilir)

set -e

echo "=== Electron RE Tool Installer ==="

# Node.js araçları
echo "[1/5] Installing npm tools..."
npm install -g @electron/asar @electron/fuses source-map prettier

# Deobfuscation
echo "[2/5] Installing deobfuscation tools..."
npm install -g webcrack humanify

# Python araçları
echo "[3/5] Installing Python tools..."
pip3 install electron-inject asar-tools restringer

# Rust (opsiyonel)
echo "[4/5] Installing Rust tools..."
if command -v cargo &> /dev/null; then
    cargo install electron-injector
else
    echo "  ⚠️  Rust/Cargo bulunamadı. electron-injector atlandı."
    echo "     Kurmak için: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
fi

# jsluice (Go)
echo "[5/5] Installing jsluice..."
if command -v go &> /dev/null; then
    go install github.com/BishopFox/jsluice@latest
else
    echo "  ⚠️  Go bulunamadı. jsluice atlandı."
    echo "     Kur: https://go.dev/dl/ | binary: github.com/BishopFox/jsluice/releases"
fi

echo ""
echo "=== Kurulum tamamlandı! ==="
echo "Kullanım için: skill/SKILL.md dosyasını inceleyin."
```

**Kullanım:**
```bash
chmod +x setup.sh
./setup.sh
```
