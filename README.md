# OneComme OSC Router

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-username/onecommeOSCrouter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)

An enhanced OneComme OSC plugin that adds **conditional message routing** with a web-based configuration interface. Route different types of live streaming messages to specific OSC endpoints based on customizable criteria like gift amount, platform, user status, and more.

## ✨ Key Features

- 🎯 **Conditional Routing**: Create custom rules to route messages based on conditions
- 🌐 **Web Configuration UI**: Easy-to-use browser interface for rule management  
- 📋 **Rule Templates**: Pre-configured templates for common scenarios
- 🧪 **Real-time Testing**: Test your rules against sample messages
- 🔧 **Field Filtering**: Choose which message fields to include in OSC messages
- 💾 **Rule Persistence**: Configuration automatically saved to JSON
- 🔄 **Backward Compatible**: Works with existing OneComme OSC setups
- 🚀 **Multi-Platform**: YouTube, Bilibili, Niconico support

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/onecommeOSCrouter.git
cd onecommeOSCrouter

# Install dependencies
npm install

# Run the router
npm start
# or
npm run dev
```

### Access the Web Interface

Open your browser and go to `http://localhost:19101` to access the configuration interface.

### OSC Output

OSC messages are sent to `127.0.0.1:19100` (configurable).

## 📖 Usage

### Basic Setup

1. **Start the router**: Run `npm start` or `npm run dev`
2. **Configure rules**: Open `http://localhost:19101` in your browser
3. **Create routing rules**: Use the web interface to set up conditional routing
4. **Test your setup**: Use the built-in testing tab to validate rules

### Example Rules

- **High-Value Gifts**: Route donations over $10 to special endpoints
- **Platform Separation**: Send Bilibili messages to different handlers
- **VIP Priority**: Route messages from premium users to priority queues
- **Content Filtering**: Route messages containing specific keywords

## 🎯 OSC Endpoints

### Default Endpoints
- `/onecomme/youtube` - YouTube comments
- `/onecomme/youtube-superchat` - YouTube Super Chats
- `/onecomme/bilibili-comment` - Bilibili comments  
- `/onecomme/bilibili-gift` - Bilibili gifts
- `/onecomme/niconama` - Niconico comments
- `/onecomme/niconama-gift` - Niconico gifts
- `/onecomme/common` - All messages in unified format

### Custom Endpoints
Create any custom endpoint in your rules:
- `/onecomme/high-value-gifts`
- `/onecomme/vip-messages`
- `/onecomme/platform-specific`
- And more...

## 🛠 Configuration

### Web Interface Tabs

1. **Routing Rules**: View and manage active rules
2. **Create Rule**: Build new conditional routing rules  
3. **Templates**: Quick-start with pre-configured rule templates
4. **Test Rules**: Validate rules against sample messages

### Rule Structure

Rules consist of:
- **Conditions**: When the rule should apply (field, operator, value)
- **Actions**: What to do when conditions match (route to endpoint, filter fields)
- **Logic**: AND/OR combinations for multiple conditions
- **Options**: Enable/disable, block default routing

## 📁 Project Structure

```
onecommeOSCrouter/
├── enhanced-plugin.js      # Main router plugin
├── plugin.js              # Legacy plugin (backward compatibility)
├── test-enhanced-plugin.js # Test script
├── routing-rules.json     # Rule configuration file
├── package.json           # Project configuration
├── impl/                  # Platform implementations
│   ├── bilibili/         # Bilibili message handlers
│   ├── youtube/          # YouTube message handlers  
│   └── niconico.js       # Niconico message handlers
├── web-ui/               # Web configuration interface
│   ├── index.html        # Main UI interface
│   └── app.js           # Frontend JavaScript
├── README.md             # This file
├── ENHANCED-README.md    # Detailed documentation
└── LICENSE              # MIT License
```

## 🧪 Testing

```bash
# Run test script
npm test

# Run in development mode
npm run dev

# Run legacy plugin
npm run legacy
```

The test script will:
- Start the router with sample rules
- Process example messages from all platforms
- Show routing decisions in console
- Keep web UI running for interactive testing

## 🔧 Development

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn

### Local Development
```bash
# Install dependencies
npm install

# Start in development mode  
npm run dev

# Access web UI
open http://localhost:19101
```

### API Endpoints

The router exposes REST API endpoints for rule management:

- `GET /api/rules` - Get all rules
- `POST /api/rules` - Create new rule  
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule
- `GET /api/templates` - Get rule templates
- `POST /api/rules/test` - Test rule against message

## 📚 Documentation

- [ENHANCED-README.md](ENHANCED-README.md) - Comprehensive documentation
- [Web UI Guide](ENHANCED-README.md#web-ui-guide) - Interface walkthrough
- [Rule Examples](ENHANCED-README.md#rule-examples) - Configuration examples
- [API Reference](ENHANCED-README.md#api-reference) - REST API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Virtual Cast, Inc.](https://virtualcast.jp) - Original OneComme OSC Plugin
- [OneComme](https://onecomme.com) - Live streaming comment integration platform
- The streaming community for feedback and feature requests

## 📞 Support

- 📖 Documentation: [ENHANCED-README.md](ENHANCED-README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/onecommeOSCrouter/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/onecommeOSCrouter/discussions)

---

**Happy Streaming!** 🎉