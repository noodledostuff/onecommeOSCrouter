# Release v0.8.0 - Multi-language Support & Documentation Enhancement

**Release Date:** November 18, 2025  
**Pre-release:** Yes (Beta)

---

## 🎉 What's New

### 🌍 Multi-language Documentation
- **Japanese Translation** (README.ja.md) - Full documentation in Japanese for the Japanese streaming community
- **Traditional Chinese (Hong Kong)** (README.zh-HK.md) - Complete Traditional Chinese translation for Hong Kong and Taiwan users
- **Language Selector** - Easy navigation between languages from the main README

### ❓ Comprehensive Q&A Section
Added 8 detailed questions and answers covering:
1. Why implement as a OneComme plugin (architecture rationale)
2. Standalone usage limitations
3. Binary vs String OSC message format differences
4. VRChat compatibility details
5. Performance impact assessment
6. Multi-application routing capabilities
7. Message handling behavior
8. Custom rule creation guidance

### 🤖 Developer Experience
- **WARP.md** - Comprehensive guide for AI-assisted development with architecture documentation, common commands, and development patterns
- Enhanced for future development and contributions

### 🧹 Repository Cleanup
- Updated `.gitignore` to exclude user-specific configuration files
- Removed config backups and test samples from version control
- Clean, distribution-ready repository structure

---

## 📦 Installation

### For End Users (OneComme Plugin)
1. Download the [latest release](https://github.com/noodledostuff/onecommeOSCrouter/releases/tag/v0.8.0)
2. Extract to your OneComme plugins directory as `onecommeOSCrouter`
3. Restart OneComme and enable the plugin
4. Access web interface at `http://localhost:19101`

**Note:** All dependencies are bundled - no `npm install` required!

### For Developers
```bash
git clone https://github.com/noodledostuff/onecommeOSCrouter.git
cd onecommeOSCrouter
npm install  # Only needed for development
npm test     # Run test suite
```

---

## 🔧 Technical Details

**Version:** 0.8.0  
**Node.js:** 16.0.0+ required  
**Dependencies:**
- express: ^4.18.0
- node-osc: ^9.1.1

**Supported Platforms:**
- YouTube (Comments, Super Chats, Memberships)
- Bilibili (Comments, Gifts, Guard status)
- Niconico (Comments, Premium users)

**OSC Configuration:**
- Default Port: 19100 (VRChat compatible)
- Web UI Port: 19101
- Formats: Binary (default) and UTF-8 String

---

## 📖 Documentation

- **English:** [README.md](https://github.com/noodledostuff/onecommeOSCrouter/blob/main/README.md)
- **日本語:** [README.ja.md](https://github.com/noodledostuff/onecommeOSCrouter/blob/main/README.ja.md)
- **繁體中文 (香港):** [README.zh-HK.md](https://github.com/noodledostuff/onecommeOSCrouter/blob/main/README.zh-HK.md)
- **Developer Guide:** [WARP.md](https://github.com/noodledostuff/onecommeOSCrouter/blob/main/WARP.md)

---

## 🐛 Known Issues

None reported for this release. This is a documentation and infrastructure update with no functional changes to the core plugin.

---

## 🔮 Coming Soon (v1.0 Roadmap)

- Additional platform support
- Enhanced rule templates
- Performance optimizations
- Extended API endpoints

---

## 💬 Community & Support

- **Issues:** [GitHub Issues](https://github.com/noodledostuff/onecommeOSCrouter/issues)
- **Discussions:** [GitHub Discussions](https://github.com/noodledostuff/onecommeOSCrouter/discussions)
- **License:** MIT

---

## 🙏 Acknowledgments

Special thanks to:
- VirtualCast team for the original OneComme OSC plugin inspiration
- OneComme development team for the extensible plugin architecture
- The OSC community for protocol specifications
- All contributors and users providing feedback

---

**Full Changelog:** [v0.7.0...v0.8.0](https://github.com/noodledostuff/onecommeOSCrouter/compare/v0.7.0...v0.8.0)

---

*Created by noodledostuff | Transform your streaming experience with intelligent chat-to-OSC routing* 🚀
