# OneComme OSC Router Plugin

**Transform your OneComme chat messages into powerful OSC data streams for VRChat, OBS, TouchDesigner, and other creative applications**

The OneComme OSC Router is a comprehensive plugin that bridges the gap between OneComme's multi-platform chat capture and OSC-enabled applications. It intelligently processes chat messages from YouTube, Bilibili, and Niconico, transforming them into structured OSC messages with sophisticated routing capabilities.

> ⚠️ **Important**: This is a plugin specifically designed for OneComme. It cannot be used as a standalone application and requires OneComme to be installed and running.

---

## 🎯 What This Plugin Does

The OSC Router acts as an intelligent middleware layer that:

- **Captures** all chat messages processed by OneComme from supported platforms
- **Processes** messages through customizable filtering and routing rules
- **Transforms** chat data into structured OSC messages with JSON payloads
- **Routes** messages to different OSC endpoints based on your custom logic
- **Monitors** message flow with real-time debugging and analytics

### Supported OneComme Platforms

| Platform | Message Types | Special Features |
|----------|---------------|------------------|
| **YouTube** | Comments, Super Chats, Memberships | Amount detection, currency handling, membership tiers |
| **Bilibili** | Comments, Gifts, Guard status | Coin amounts, user levels, VIP detection |
| **Niconico** | Comments, Premium users | Premium user detection, timestamp handling |

---

## ✨ Key Features

### 🅰️ Advanced Message Routing
- **Multi-Condition Logic**: Create complex rules with AND/OR logic chains
- **Platform-Specific Filtering**: Route based on platform, user status, message content, or monetary values
- **Emoji Management**: Optional removal of emoji content from chat messages for clean text output
- **Endpoint Customization**: Send different message types to different OSC addresses
- **Real-Time Processing**: Zero-latency message transformation and routing

### 🖥️ Professional Web Interface
- **Intuitive Dashboard**: Clean, tabbed interface accessible at `http://localhost:19101`
- **Live Message Monitor**: Real-time view of incoming and outgoing OSC messages
- **Rule Builder**: Visual rule creation with condition testing
- **Configuration Management**: Export/import settings for easy backup and sharing

### 💾 Intelligent Persistence
- **Auto-Save Everything**: Settings, rules, and UI preferences automatically saved
- **Session Continuity**: Remembers your last active tab and form drafts
- **Backup System**: Automatic configuration backups prevent data loss
- **Migration Support**: Seamless updates with configuration versioning

### 🔧 Developer-Friendly Architecture
- **RESTful API**: Complete HTTP API for programmatic control
- **Extensible Design**: Platform handlers can be easily extended
- **Comprehensive Logging**: Detailed debug output and message tracking
- **Test Suite**: Built-in tests for configuration and OSC reliability

---

## 🚀 OneComme Integration Guide

### Prerequisites
- **OneComme** installed and configured for your streaming platforms
- **Node.js 16.0.0+** (usually bundled with OneComme plugins)
- **OSC-enabled application** (VRChat, OBS, TouchDesigner, etc.)

### Installation in OneComme

1. **Download the Plugin**
   - Clone or download this repository to your OneComme plugins directory
   - Ensure all files are in a folder named `onecommeOSCrouter`
   - All required dependencies are included with the plugin

2. **Enable in OneComme**
   - Restart OneComme to detect the new plugin
   - Navigate to OneComme's plugin settings
   - Enable "OneComme OSC Router"

3. **Verify Installation**
   - Check OneComme's console for plugin load messages
   - Visit `http://localhost:19101` to access the web interface
   - Ensure no error messages appear during startup

---

## ⚙️ Configuration & Setup

### Initial Configuration

When first loaded, the plugin creates a default configuration optimized for common use cases:

**Default OSC Settings:**
- **Host**: `127.0.0.1` (local machine)
- **Port**: `19100` (standard VRChat OSC port)
- **Web Interface**: `http://localhost:19101`

**Default Message Routes:**
- `/onecomme/youtube/comment` → YouTube comments
- `/onecomme/youtube/superchat` → YouTube Super Chats
- `/onecomme/bilibili/comment` → Bilibili comments
- `/onecomme/bilibili/gift` → Bilibili gifts
- `/onecomme/niconico/comment` → Niconico comments

### Web Interface Overview

Access the configuration interface at `http://localhost:19101`:

#### 📊 **Overview Tab**
- Real-time message statistics
- Connection status indicators
- Quick access to common settings
- System health monitoring

#### 📜 **Rules Tab**
- Create and manage routing rules with visual rule builder
- **Edit existing rules** using the dedicated edit modal with pre-populated forms
- Enable/disable rules with toggle switches
- Delete rules with confirmation prompts  
- Test rules with sample messages
- Import/export rule sets
- Rule priority management

#### 📋 **Logs Tab**
- Live message monitor showing incoming/outgoing data
- Message filtering and search
- Export logs for debugging
- Clear log history

#### ⚙️ **Settings Tab**
- OSC output configuration
- **Emoji Removal**: Toggle to remove emoji content from chat messages
- Web interface preferences
- Advanced connection settings
- Configuration backup/restore

---

## 🎨 Creating Custom Routing Rules

The rule system enables sophisticated message processing logic. Here are comprehensive examples:

### Example 1: High-Value Donation Alerts

**Goal**: Route significant donations to a special alert endpoint

```json
{
  "name": "High Value Donations",
  "description": "Route big donations to alert system",
  "endpoint": "/alerts/bigdonation",
  "conditions": {
    "logic": "OR",
    "groups": [
      {
        "logic": "AND",
        "conditions": [
          {"field": "service", "operator": "equals", "value": "youtube"},
          {"field": "type", "operator": "equals", "value": "superchat"},
          {"field": "amount", "operator": "greater_than", "value": "20"}
        ]
      },
      {
        "logic": "AND",
        "conditions": [
          {"field": "service", "operator": "equals", "value": "bilibili"},
          {"field": "type", "operator": "equals", "value": "gift"},
          {"field": "coins", "operator": "greater_than", "value": "100"}
        ]
      }
    ]
  },
  "fieldMappings": {
    "username": "name",
    "message": "comment",
    "value": ["amount", "coins"],
    "currency": "currency",
    "platform": "service"
  }
}
```

### Example 2: VIP User Routing

**Goal**: Separate VIP users (members, guards, premium) to special endpoints

```json
{
  "name": "VIP Users",
  "description": "Route VIP user messages separately",
  "endpoint": "/chat/vip",
  "conditions": {
    "logic": "OR",
    "groups": [
      {"field": "is_member", "operator": "equals", "value": true},
      {"field": "is_guard", "operator": "equals", "value": true},
      {"field": "is_premium", "operator": "equals", "value": true}
    ]
  },
  "fieldMappings": {
    "user": "name",
    "message": "comment",
    "vip_type": "user_type",
    "platform": "service"
  }
}
```

### Example 3: Content Filtering

**Goal**: Filter inappropriate content and route clean messages

```json
{
  "name": "Content Filter",
  "description": "Block inappropriate content",
  "endpoint": "/chat/filtered",
  "conditions": {
    "logic": "NOT",
    "groups": [
      {
        "logic": "OR",
        "conditions": [
          {"field": "comment", "operator": "contains", "value": "spam"},
          {"field": "comment", "operator": "contains", "value": "inappropriate"},
          {"field": "comment", "operator": "regex", "value": "\\b(bad|word)\\b"}
        ]
      }
    ]
  },
  "fieldMappings": {
    "clean_message": "comment",
    "user": "name",
    "timestamp": "timestamp"
  }
}
```

### Available Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `"service" equals "youtube"` |
| `not_equals` | Not equal | `"type" not_equals "comment"` |
| `contains` | String contains | `"comment" contains "hello"` |
| `not_contains` | String doesn't contain | `"comment" not_contains "spam"` |
| `greater_than` | Numeric comparison | `"amount" greater_than "10"` |
| `less_than` | Numeric comparison | `"amount" less_than "5"` |
| `regex` | Regular expression | `"comment" regex "\\d+"` |
| `exists` | Field has value | `"amount" exists` |
| `not_exists` | Field is empty | `"gift_name" not_exists` |

---

## 📡 OSC Message Format

All OSC messages sent by the plugin contain structured JSON data:

### Standard Message Structure

```json
{
  "timestamp": "2024-09-20T08:30:01.123Z",
  "service": "youtube",
  "type": "superchat",
  "user": {
    "id": "UC1234567890",
    "name": "StreamerFan123",
    "display_name": "StreamerFan123"
  },
  "message": {
    "content": "Great stream! Keep it up!",
    "id": "msg_12345"
  },
  "platform_data": {
    "amount": "5.00",
    "currency": "USD",
    "is_member": true,
    "membership_months": 6
  },
  "processing": {
    "rule_matched": "High Value Donations",
    "endpoint": "/alerts/bigdonation",
    "processed_at": "2024-09-20T08:30:01.125Z"
  }
}
```

### Platform-Specific Fields

#### YouTube Messages
```json
{
  "amount": "10.00",
  "currency": "USD",
  "is_member": true,
  "membership_months": 12,
  "channel_id": "UC1234567890",
  "video_id": "dQw4w9WgXcQ"
}
```

#### Bilibili Messages
```json
{
  "coins": 100,
  "gift_name": "Cola",
  "gift_id": 30607,
  "is_guard": false,
  "user_level": 15,
  "room_id": 12345
}
```

#### Niconico Messages
```json
{
  "is_premium": true,
  "user_id": "12345",
  "comment_no": 150,
  "live_id": "lv12345"
}
```

---

## 🔧 Advanced Configuration

### Configuration Files

All plugin settings are stored locally in the plugin directory:

- **`config.json`** - Main configuration with all settings
- **`routing-rules.json`** - Your custom routing rules
- **`config.backup.json`** - Automatic backup created on changes

### Environment Variables

Override default settings using environment variables:

```bash
# Change OSC output port
OSC_PORT=9000

# Change web interface port
WEB_UI_PORT=8080

# Enable debug logging
DEBUG_LOGGING=true
```

### Advanced Settings

Access advanced settings through the web interface:

**OSC Output Settings:**
- OSC host/port configuration
- **OSC Message Format**: Choose between Binary Blob (default) or UTF-8 String
  - **Binary**: Sends JSON as binary data (recommended for most OSC receivers)
  - **String**: Sends JSON as plain text string (useful for text-based receivers or debugging)
- Default endpoints enable/disable toggle

**Message Processing Settings:**
- **Emoji Removal**: Strip emoji content (both HTML tags and Unicode emojis) from chat messages
  - Removes `<img>` tags containing emoji representations
  - Removes Unicode emoji characters and combining sequences
  - Maintains clean text output for applications that don't support emoji rendering

**Connection Settings:**
- OSC reconnection intervals
- Maximum reconnection attempts
- Connection health check frequency

**Performance Settings:**
- Message queue size
- Processing thread count
- Memory usage limits

**Logging Settings:**
- Log retention period
- Log file rotation
- Debug output levels

---

## 🧪 Testing & Debugging

### Built-in Test Suite

The plugin includes comprehensive testing tools:

#### Configuration Test
Verify configuration system reliability:
```bash
node tests/test-config-persistence.js
```
**Tests**: File I/O, setting validation, backup creation, migration logic

#### OSC Reliability Test
Ensure OSC message delivery:
```bash
node tests/test-osc-reliability.js
```
**Tests**: Message sending, Unicode support, error handling, concurrent delivery

#### Real-Time Monitor
Watch OSC messages in real-time:
```bash
node tests/osc-monitor.js
```
**Features**: Live message display, statistics tracking, log export

#### OSC Message Format Test
Test both binary and string OSC message formats:
```bash
node tests/test-osc-message-formats.js
```
**Tests**: Configuration system, binary/string message creation, Unicode handling, emoji removal, format comparison

### Troubleshooting Common Issues

#### Messages Not Appearing in Target Application

**Check OSC Settings:**
1. Verify target application is listening on the correct port
2. Confirm IP address (usually `127.0.0.1` for local)
3. Check firewall settings for UDP traffic

**Debug Steps:**
1. Run `node tests/osc-monitor.js` to verify messages are sent
2. Check OneComme console for error messages
3. Verify rules are matching expected messages

#### Rules Not Triggering

**Validation Steps:**
1. Use the rule tester in the web interface
2. Check condition logic (AND vs OR)
3. Verify field names match incoming message structure
4. Test with simplified conditions first

#### Configuration Not Saving

**File Permission Issues:**
1. Check write permissions in plugin directory
2. Ensure OneComme has file system access
3. Look for disk space issues

#### Web Interface Not Loading

**Connection Issues:**
1. Verify port 19101 is available
2. Check for other applications using the port
3. Try accessing from different browser
4. Check OneComme's console for web server errors

#### OSC Messages Not Parsing Correctly

**Message Format Issues:**
1. Try switching between Binary and String format in Settings
2. **Binary format** works best with most OSC applications (VRChat, TouchOSC)
3. **String format** may be needed for text-based or custom OSC receivers
4. Run `node tests/test-osc-message-formats.js` to verify format handling
5. Check your OSC receiver's expected data format (some expect strings, others binary)

---

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OneComme      │───▶│  OSC Router      │───▶│  Target App     │
│  (Chat Source)  │    │   Plugin         │    │  (VRChat/OBS)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │  Web Interface   │
                        │  (localhost:19101│
                        └──────────────────┘
```

### Core Components

**Message Processor**: Receives messages from OneComme's event system
**Rule Engine**: Evaluates conditions and determines routing
**OSC Client**: Sends formatted messages to target applications
**Web Server**: Provides configuration interface and real-time monitoring
**Config Manager**: Handles persistent storage and backup

### API Endpoints

The plugin exposes a RESTful API for programmatic control:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rules` | List all routing rules |
| POST | `/api/rules` | Create new routing rule |
| PUT | `/api/rules/:id` | Update existing rule |
| DELETE | `/api/rules/:id` | Delete rule |
| GET | `/api/config/full` | Get complete configuration |
| PUT | `/api/config/full` | Update complete configuration |
| GET | `/api/config/ui` | Get UI preferences |
| PUT | `/api/config/ui` | Update UI preferences |
| GET | `/api/logs` | Get recent message logs |
| DELETE | `/api/logs` | Clear message logs |
| POST | `/api/test/rule` | Test rule against sample message |
| POST | `/api/export` | Export configuration |
| POST | `/api/import` | Import configuration |
| GET | `/api/status` | Get system status |

---

## 🤝 Contributing to the Project

### Development Environment Setup

> **Note**: These steps are only required for developers working on the plugin source code. End users do not need to install dependencies as they are bundled with the plugin.

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/onecommeOSCrouter.git
   cd onecommeOSCrouter
   ```

2. **Install Development Dependencies**
   ```bash
   npm install  # Only needed for development work
   ```

3. **Run Development Tests**
   ```bash
   npm test
   ```

### Project Structure

```
onecommeOSCrouter/
├── plugin.js                 # Main plugin entry point
├── web-ui/                   # Web interface files
│   ├── index.html           # Main UI page
│   ├── app.js               # Frontend application logic
│   └── source-schemas.js    # Platform field definitions
├── impl/                     # Platform-specific handlers
│   ├── youtube/             # YouTube message processing
│   ├── bilibili/            # Bilibili message processing
│   └── niconico.js          # Niconico message processing
├── tests/                    # Test suite
│   ├── test-config-persistence.js
│   ├── test-osc-reliability.js
│   ├── osc-monitor.js
│   └── README.md
├── docs/                     # Documentation
├── node_modules/            # Bundled dependencies (included with plugin)
├── config.json              # Runtime configuration (created automatically)
├── routing-rules.json       # User-defined rules (created automatically)
├── package.json             # Node.js dependencies manifest
├── LICENSE                  # MIT license
└── README.md               # This file
```

### Contributing Guidelines

**Bug Reports**
- Use GitHub issues with detailed reproduction steps
- Include OneComme version, Node.js version, and OS information
- Provide relevant log output from OneComme console

**Feature Requests**
- Explain the use case and expected behavior
- Consider if the feature fits the plugin's scope
- Provide mockups or examples if applicable

**Pull Requests**
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for user-facing changes
- Test with OneComme before submitting

### Community Resources

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and community sharing
- **Wiki**: Additional documentation and tutorials
- **Examples Repository**: Community-contributed rule templates

---

## 📄 License & Credits

**MIT License** - See [LICENSE](LICENSE) file for complete terms

### Third-Party Dependencies
- **node-osc**: OSC communication library
- **express**: Web server framework
- **OneComme**: Chat capture platform (required)

### Acknowledgments
- **VirtualCast team** for the original OneComme OSC plugin that inspired this project
- OneComme development team for the extensible plugin architecture
- OSC community for protocol specifications and best practices
- Contributors and users who provide feedback and improvements

---

**Created by noodledostuff** | [GitHub Profile](https://github.com/noodledostuff)

*Transform your streaming experience with intelligent chat-to-OSC routing* 🚀