# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**OneComme OSC Router Plugin** - A middleware plugin for OneComme that transforms multi-platform chat messages (YouTube, Bilibili, Niconico) into structured OSC messages with sophisticated routing capabilities. The plugin runs within OneComme's environment and provides a web-based configuration interface.

**Key Architecture**:
- **Node.js plugin** (`plugin.js`) that integrates with OneComme's event system
- **Platform-specific handlers** (`impl/`) convert platform messages to unified format
- **Rule engine** evaluates conditional routing logic (AND/OR/NOT operators)
- **OSC client** sends UDP messages (binary or UTF-8 string format)
- **Express web server** provides REST API and UI at `localhost:19101`
- **Configuration persistence** with auto-backup and migration support

## Common Development Commands

### Testing
```bash
# Run all tests
npm test

# Individual test suites
npm run test:config          # Configuration persistence tests
npm run test:osc             # OSC reliability tests
npm run test:formats         # OSC message format tests

# Real-time OSC message monitoring
npm run monitor
```

### Development
```bash
# Start plugin (normally launched by OneComme)
npm start

# Development mode (for standalone testing)
npm run dev
```

**Note**: End users do not need to run `npm install` - dependencies are bundled with the plugin. Only developers working on the source need to install dependencies.

## Architecture Deep Dive

### Core Components Flow

```
OneComme → MessageConverter → RuleEngine → OSCMessageSender → Target Application
                ↓                 ↓              ↓
         Platform Handlers    routing-rules.json   Binary/String Format
         (impl/youtube,        + ConfigManager      (node-osc)
          impl/bilibili,
          impl/niconico)
```

### Key Classes and Responsibilities

**ConfigManager** (`plugin.js:74-407`)
- Loads/saves `config.json` with deep merge for upgrades
- Handles config versioning and migration (currently v2.0.0)
- Auto-creates backups before saving (`config.backup.json`)
- Provides getters/setters for all config sections (OSC, UI, messageProcessing, ruleEngine, advanced)

**RuleEngine** (`plugin.js:409-743`)
- Loads routing rules from `routing-rules.json`
- Evaluates rules with nested condition groups (AND/OR/NOT logic)
- Supports operators: `equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `regex`, `exists`, `not_exists`
- Matches by platform (service), messageType (comment/gift/superchat), and custom conditions
- Field filtering based on rule configuration

**OSCMessageSender** (`plugin.js:470-587`)
- Creates node-osc Client instances
- Supports two message formats:
  - **Binary** (default): JSON as binary blob via `Message()` 
  - **String**: JSON as UTF-8 string argument
- Handles emoji removal (HTML `<img>` tags + Unicode emoji sequences)
- Manages connection health and auto-reconnect

**MessageLogger** (`plugin.js:17-71`)
- Circular buffer storing last N messages (default 100)
- Tracks incoming (from OneComme) and outgoing (to OSC) messages
- Provides data for web UI logs tab

**EnhancedMessageConverter** (`plugin.js:745-788`)
- Routes messages to platform-specific handlers
- Converts OneComme's raw data to plugin's unified message format
- Determines if message is gift/superchat vs regular comment

### Platform Handler Structure

Each platform in `impl/` follows this pattern:

**YouTube** (`impl/youtube/`)
- `common.js` - Base class with shared logic
- `comment.js` - Regular YouTube comments
- `super.js` - Super Chats with amount/currency parsing
- `index.js` - Exports all YouTube handlers

**Bilibili** (`impl/bilibili/`)
- `common.js` - Base class with user level, VIP status, guard detection
- `comment.js` - Regular Bilibili comments
- `gift.js` - Gift messages with coin amounts
- `index.js` - Exports all Bilibili handlers

**Niconico** (`impl/niconico.js`)
- Single file with comment and gift classes
- Premium user detection

### Configuration System

**Main Config** (`config.json`)
- `oscPort`, `oscHost` - OSC output destination
- `oscMessageFormat` - 'binary' or 'string'
- `enableDefaultEndpoints` - Toggle default platform endpoints
- `messageProcessing.removeEmojis` - Strip emoji from messages
- `ui.*` - Web interface preferences (last tab, refresh intervals)
- `advanced.*` - Reconnection, health checks, queue limits

**Routing Rules** (`routing-rules.json`)
Array of rule objects:
```javascript
{
  "id": "unique-id",
  "name": "Rule Name",
  "enabled": true,
  "conditionGroups": [
    {
      "source": "youtube|bilibili|niconama",
      "messageType": "comment|gift|superchat",
      "conditions": [
        {"field": "price", "operator": "greater_than", "value": 20}
      ],
      "conditionLogic": "AND"
    }
  ],
  "groupLogic": "OR",
  "actions": [
    {
      "type": "route_to_endpoint",
      "endpoint": "/custom/endpoint",
      "fields": ["name", "comment", "price"]
    }
  ],
  "blockDefault": false
}
```

### Web UI Architecture

**Express Server** (`WebUIServer` class)
- Serves static files from `web-ui/`
- REST API endpoints under `/api/*`

**Key API Endpoints**:
- `GET/POST/PUT/DELETE /api/rules` - CRUD for routing rules
- `GET/PUT /api/config/full` - Complete configuration
- `GET/PUT /api/config/ui` - UI preferences only
- `GET /api/logs` - Message history from MessageLogger
- `POST /api/rules/test` - Test rule against sample message
- `GET /api/status` - System health

**Frontend** (`web-ui/app.js`)
- Vanilla JavaScript, no framework
- Tab-based interface: Overview, Rules, Logs, Settings
- Rule builder with visual condition editor
- Real-time log viewer with auto-refresh

## Important Development Notes

### OSC Message Format
- **Binary format** (default): Most OSC applications expect this. Creates `Message()` with JSON as binary argument.
- **String format**: For text-based receivers or debugging. Sends JSON as plain string argument.
- Format is configurable via Settings tab or `config.oscMessageFormat`

### Emoji Removal
When enabled (`messageProcessing.removeEmojis`):
1. Removes HTML `<img>` tags with emoji classes
2. Strips Unicode emoji using comprehensive regex (emoji sequences, skin tones, ZWJ sequences)
3. Applied before message routing

### Rule Evaluation Logic
- Rules with `enabled: false` are skipped
- Each rule has condition groups evaluated with `groupLogic` (AND/OR)
- Within each group, conditions evaluated with `conditionLogic` (AND/OR)
- Platform matching uses `matchesPlatform()` with fallback field detection
- Multiple rules can match - all matching rules execute their actions
- `blockDefault: true` prevents default platform endpoints from firing

### Config Persistence
- **Auto-save**: All config changes immediately persist to disk
- **Auto-backup**: Creates `config.backup.json` before every save
- **Migration**: `migrateConfig()` deep-merges old configs with new defaults
- **Version tracking**: `config.version` enables future upgrade logic

### Testing Strategy
- `test-config-persistence.js`: Validates save/load/backup/export
- `test-osc-reliability.js`: Tests message sending, Unicode, error handling
- `test-osc-message-formats.js`: Validates binary vs string formats, emoji removal
- `osc-monitor.js`: Live OSC message viewer for debugging

### OneComme Integration
- Plugin loads via OneComme's plugin system (looks for `plugin.js`)
- OneComme emits comment events: `{service: "youtube|bilibili|niconama", data: {...}}`
- Plugin registers listener: `onComment((service, data) => {...})`
- All dependencies bundled in `node_modules/` (express, node-osc)

## Common Patterns

### Adding a New Platform
1. Create `impl/newplatform/` directory
2. Create `common.js` base class extending appropriate parent
3. Create `comment.js` and `gift.js` (if platform has gifts)
4. Export classes in `index.js`
5. Import in main `plugin.js`
6. Add conversion logic in `EnhancedMessageConverter.convert()`

### Adding a New Condition Operator
1. Add case in `RuleEngine.evaluateCondition()`
2. Implement comparison logic
3. Document in `source-schemas.js` for web UI

### Adding a New Config Setting
1. Add default value in `ConfigManager.getDefaultConfig()`
2. Create getter/setter methods in ConfigManager
3. Add UI controls in `web-ui/index.html`
4. Wire up API endpoint if needed (or use existing `/api/config/full`)

### Debugging Message Flow
1. Enable `messageProcessing.enableDebugLogging`
2. Check OneComme console for incoming message logs
3. Use `npm run monitor` to verify OSC output
4. Check web UI Logs tab for processed messages
5. Test rules with `/api/rules/test` endpoint

## File Structure Reference

```
plugin.js                    # Main entry, all core classes
config.json                  # Runtime configuration
routing-rules.json           # User routing rules
impl/
  ├── youtube/              # YouTube handlers
  ├── bilibili/             # Bilibili handlers
  ├── niconico.js           # Niconico handler
  ├── comment.js            # Base comment class
  ├── types.js              # Type definitions
web-ui/
  ├── index.html            # Main UI page
  ├── app.js                # Frontend logic
  ├── source-schemas.js     # Platform field schemas
tests/
  ├── test-config-persistence.js
  ├── test-osc-reliability.js
  ├── test-osc-message-formats.js
  ├── osc-monitor.js
```
