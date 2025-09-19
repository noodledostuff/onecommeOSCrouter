# OneComme OSC Plugin - Enhanced with Conditional Routing

An advanced version of the OneComme OSC plugin that adds **conditional message routing** with a web-based configuration interface. This plugin allows you to create custom rules to route different types of messages to specific OSC endpoints based on various criteria like gift amount, platform, user status, and more.

## 🌟 Features

### Core Features
- **Multi-Platform Support**: YouTube, Bilibili, Niconico
- **Standard OSC Routing**: Messages sent to platform-specific and common endpoints
- **Error Handling**: Robust error handling with graceful degradation

### Enhanced Features ✨
- **Conditional Routing**: Create custom rules to route messages based on conditions
- **Web Configuration UI**: Easy-to-use browser-based interface for rule management
- **Rule Templates**: Pre-configured templates for common use cases
- **Real-time Testing**: Test your rules against sample messages
- **Field Filtering**: Choose which message fields to include in OSC messages
- **Rule Persistence**: Configuration automatically saved to JSON file

## 🚀 Quick Start

### 1. Installation

```bash
# Install required dependencies
npm install express node-osc

# Or if using the existing onecommeOSCplugin:
cd onecommeOSCplugin
npm install express
```

### 2. Run the Enhanced Plugin

```bash
# Test the plugin
node test-enhanced-plugin.js

# The web UI will be available at: http://localhost:19101
# OSC messages will be sent to: 127.0.0.1:19100
```

### 3. Access the Web Interface

Open your browser and go to `http://localhost:19101` to access the configuration interface.

## 📖 Web UI Guide

### Tabs Overview

#### 1. **Routing Rules** Tab
- View all active routing rules
- Enable/disable rules with toggle switches
- Edit or delete existing rules
- See rule conditions and actions at a glance

#### 2. **Create Rule** Tab
- **Rule Name**: Descriptive name for your rule
- **Description**: Optional detailed description
- **Conditions**: Define when the rule should apply
  - Field selection (message type, user name, gift price, etc.)
  - Operators (equals, greater than, contains, etc.)
  - Value and data type specification
  - AND/OR logic for multiple conditions
- **Custom Endpoint**: OSC endpoint to send matching messages
- **Field Selection**: Choose which message fields to include
- **Block Default**: Optionally prevent sending to default endpoints

#### 3. **Templates** Tab
- Pre-configured rule templates for common scenarios:
  - **High Value Gifts Only**: Route expensive gifts to special endpoint
  - **Bilibili Only**: Route only Bilibili messages
  - **VIP Users Only**: Route messages from VIP/premium users
- Click any template to auto-populate the Create Rule form

#### 4. **Test Rules** Tab
- Test your rules against sample messages
- JSON input area for custom test messages
- Real-time results showing which rules match
- Validation and error reporting

## 🎯 Rule Examples

### Example 1: High-Value Gifts
Route gifts worth more than $10 to a special endpoint:

```json
{
  "name": "High Value Gifts",
  "conditions": [
    {
      "field": "price",
      "operator": "greater_than", 
      "value": 10,
      "dataType": "number"
    },
    {
      "field": "hasGift",
      "operator": "equals",
      "value": true,
      "dataType": "boolean"
    }
  ],
  "conditionLogic": "AND",
  "actions": [
    {
      "type": "route_to_endpoint",
      "endpoint": "/onecomme/high-value-gifts",
      "fields": ["name", "comment", "price", "giftName"]
    }
  ]
}
```

### Example 2: Platform-Specific Routing
Route only Bilibili messages to a custom endpoint:

```json
{
  "name": "Bilibili Only",
  "conditions": [
    {
      "field": "type",
      "operator": "contains",
      "value": "bilibili",
      "dataType": "string"
    }
  ],
  "actions": [
    {
      "type": "route_to_endpoint", 
      "endpoint": "/onecomme/bilibili-only",
      "fields": ["name", "comment", "userLevel", "guardLevel"]
    }
  ],
  "blockDefault": true
}
```

### Example 3: VIP Users
Route messages from VIP users to a priority endpoint:

```json
{
  "name": "VIP Priority",
  "conditions": [
    {
      "field": "isVip",
      "operator": "equals",
      "value": true,
      "dataType": "boolean"
    }
  ],
  "actions": [
    {
      "type": "route_to_endpoint",
      "endpoint": "/onecomme/vip-priority", 
      "fields": ["name", "comment", "userLevel"]
    }
  ]
}
```

## 📡 OSC Endpoints

### Default Endpoints
- `/onecomme/youtube` - YouTube comments
- `/onecomme/youtube-superchat` - YouTube Super Chats  
- `/onecomme/bilibili-comment` - Bilibili comments
- `/onecomme/bilibili-gift` - Bilibili gifts
- `/onecomme/niconama` - Niconico comments
- `/onecomme/niconama-gift` - Niconico gifts
- `/onecomme/common` - All messages in unified format

### Custom Endpoints
You can create any custom endpoint path in your rules, for example:
- `/onecomme/high-value-gifts`
- `/onecomme/vip-messages`
- `/onecomme/bilibili-only`
- `/onecomme/emergency-alerts`

## 🛠 Available Fields

### Common Fields
- `name` - User name
- `comment` - Message text
- `timestamp` - Message timestamp
- `type` - Message type (youtube-comment, bilibili-gift, etc.)
- `profileImageUrl` - User avatar URL

### Gift-Specific Fields
- `hasGift` - Boolean indicating if message includes a gift
- `price` - Gift value in currency
- `giftName` - Name of the gift

### Platform-Specific Fields

#### Bilibili
- `userLevel` - User level (1-60)
- `guardLevel` - Guard level (0=none, 1=governor, 2=admiral, 3=captain)
- `isVip` - VIP status
- `isSvip` - SVIP status

#### YouTube
- `isMember` - Channel member status
- `isModerator` - Moderator status

## 🔧 Configuration

### Rule Configuration File
Rules are automatically saved to `routing-rules.json` in the plugin directory. You can also manually edit this file if needed.

### Port Configuration
- **Web UI Port**: 19101 (configurable in `enhanced-plugin.js`)
- **OSC Port**: 19100 (matches original plugin)
- **OSC Host**: 127.0.0.1

## 🧪 Testing

### Using the Test Script
```bash
node test-enhanced-plugin.js
```

This will:
1. Start the plugin and web UI
2. Process sample messages from all platforms
3. Show routing decisions in the console
4. Keep the web UI running for interactive testing

### Sample Test Message
Use this JSON in the Test Rules tab:

```json
{
  \"type\": \"bilibili-gift\",
  \"name\": \"TestUser\",
  \"comment\": \"Thanks for streaming!\",
  \"hasGift\": true,
  \"price\": 50,
  \"giftName\": \"辣条\",
  \"userLevel\": 25,
  \"guardLevel\": 1,
  \"isVip\": false
}
```

## 📈 Advanced Usage

### Custom Field Filtering
You can specify exactly which fields to include in your custom OSC messages:

```json
{
  \"fields\": [\"name\", \"comment\", \"price\"]
}
```

### Blocking Default Routing
Set `blockDefault: true` to prevent messages from being sent to the standard endpoints:

```json
{
  \"blockDefault\": true
}
```

### Regular Expression Matching
Use regex patterns for advanced text matching:

```json
{
  \"field\": \"comment\",
  \"operator\": \"regex\",
  \"value\": \"^(hello|hi|hey)\",
  \"dataType\": \"string\"
}
```

## 🎨 Styling and Themes

The web interface uses a modern, responsive design with:
- Gradient backgrounds
- Smooth animations
- Card-based layout
- Mobile-friendly responsive design
- Font Awesome icons
- Animate.css animations

## 🤝 Integration with Existing Plugin

This enhanced version maintains full backward compatibility with the original OneComme OSC plugin:

- All existing OSC endpoints continue to work
- Message formats remain unchanged  
- No breaking changes to existing integrations
- Can be used as a drop-in replacement

## 💡 Use Cases

### Streaming Applications
- **VIP Recognition**: Highlight messages from paying subscribers
- **High-Value Alerts**: Special notifications for large donations
- **Platform Separation**: Different handling for each streaming platform
- **Moderation**: Route flagged messages to moderation endpoints

### Analytics and Logging
- **Engagement Tracking**: Route different message types for analytics
- **Revenue Monitoring**: Track gift/donation patterns
- **User Behavior**: Analyze messaging patterns by user type

### Interactive Features
- **Games and Polls**: Route specific message types to game logic
- **Sound Effects**: Trigger different sounds based on message criteria
- **Visual Effects**: Dynamic overlays based on message content

## 🔍 Troubleshooting

### Common Issues

**Web UI not loading**
- Check that port 19101 is not in use by another application
- Ensure Express.js is installed: `npm install express`

**OSC messages not received** 
- Verify your OSC receiver is listening on 127.0.0.1:19100
- Check firewall settings
- Review console output for connection errors

**Rules not working**
- Verify rule syntax in the web UI test tab
- Check console output for rule evaluation logs
- Ensure field names match message structure exactly

**Performance issues**
- Limit the number of active rules (recommend < 50)
- Use specific conditions rather than broad regex patterns
- Consider rule ordering for frequently matched conditions

## 📝 API Reference

### REST API Endpoints

#### `GET /api/rules`
Returns all configured routing rules.

#### `POST /api/rules`  
Creates a new routing rule.

#### `PUT /api/rules/:id`
Updates an existing rule.

#### `DELETE /api/rules/:id`
Deletes a rule.

#### `GET /api/templates`
Returns available rule templates.

#### `POST /api/rules/test`
Tests a rule against a sample message.

## 🏗 Architecture

### Components
- **RuleEngine**: Evaluates conditions and processes rules
- **EnhancedMessageConverter**: Converts platform messages with routing
- **WebUIServer**: Serves the configuration interface
- **EnhancedDomain**: Main plugin class integrating all components

### Message Flow
1. OneComme sends comment data to plugin
2. EnhancedMessageConverter processes the data
3. RuleEngine evaluates all active rules
4. Custom actions are executed for matching rules
5. Default routing occurs (unless blocked)
6. OSC messages sent to appropriate endpoints

## 📄 License

This project maintains the same license as the original OneComme OSC plugin.

## 🤝 Contributing

Contributions are welcome! Please consider:
- Additional rule templates for common use cases
- New condition operators or field types
- UI improvements and themes
- Performance optimizations
- Additional platform integrations

---

**Happy Streaming!** 🎉

For support or questions, please refer to the OneComme documentation or community forums.