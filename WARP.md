# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

OneComme OSC Router is a sophisticated Node.js plugin designed to bridge OneComme (a multi-platform chat capture application) with OSC-enabled applications like VRChat, OBS, and TouchDesigner. The plugin captures chat messages from YouTube, Bilibili, Niconico, and Twitch, processes them through customizable routing rules, and forwards them as structured OSC messages.

**Important Context**: This is a plugin specifically for OneComme - it cannot run standalone and requires OneComme to be installed and running.

## Development Commands

### Core Development
```bash
# Start the plugin in development mode
npm run dev
# or
node plugin.js

# Run the plugin normally
npm start

# Run basic tests
npm test
```

### Testing Suite
```bash
# Test configuration persistence system
node tests/test-config-persistence.js

# Test OSC message reliability and delivery
node tests/test-osc-reliability.js

# Monitor OSC messages in real-time (for debugging)
node tests/osc-monitor.js

# Test Twitch integration handlers
node tests/test-twitch-integration.js
```

### Development Server
The plugin includes a web UI that starts automatically on `http://localhost:19101` when the plugin runs. This provides:
- Real-time message monitoring
- Rule configuration interface
- Configuration management
- Live debugging tools

## Architecture

### Core System Components

**Plugin Entry Point** (`plugin.js`)
- Main orchestrator that initializes all subsystems
- Integrates with OneComme's plugin architecture via exports
- Manages OSC client connections and message routing
- Hosts the web UI server on port 19101

**Message Processing Pipeline**:
1. **Platform Handlers** (`impl/` directory) - Parse platform-specific message formats
2. **Rule Engine** - Evaluates routing conditions and determines endpoints  
3. **OSC Client** - Formats and sends messages to target applications
4. **Message Logger** - Tracks all incoming/outgoing messages for debugging

### Platform-Specific Implementations

The `impl/` directory contains modular handlers for each supported platform:

- **YouTube** (`impl/youtube/`) - Handles comments and SuperChats with currency/membership detection
- **Bilibili** (`impl/bilibili/`) - Processes comments and gifts with VIP/Guard status
- **Niconico** (`impl/niconico.js`) - Manages comments with premium user detection
- **Twitch** (`impl/twitch/`) - Handles comments, subscriptions, bits/cheering, and raids with comprehensive user status detection

Each platform implementation exports standardized message classes that the main router can process uniformly.

### Configuration System

**Multi-layered Configuration**:
- `config.json` - Main runtime configuration (auto-generated)
- `routing-rules.json` - User-defined conditional routing rules
- `config.backup.json` - Automatic backup created on changes
- UI preferences stored within config for session continuity

The `ConfigManager` class handles:
- Automatic migration between configuration versions
- Deep merging of default and user settings
- Persistent storage with backup creation
- Environment variable override support

### Rule Engine Architecture

**Sophisticated Conditional Logic**:
- Supports nested AND/OR condition groups
- Platform-specific field matching (e.g., `amount`, `coins`, `is_member`)
- Multiple operators: `equals`, `greater_than`, `contains`, `regex`, etc.
- Field mapping for customized OSC output structure
- Rule priority and execution order management

**Rule Structure**:
```json
{
  "conditionGroups": [
    {
      "source": "youtube",
      "messageType": "superchat", 
      "conditions": [{"field": "price", "operator": "greater_than", "value": 20}]
    }
  ],
  "actions": [{"type": "route_to_endpoint", "endpoint": "/alerts/bigdonation"}]
}
```

### Web UI System

**Frontend Architecture** (`web-ui/`):
- `app.js` - Main UI controller with tab management, real-time updates, and form persistence
- `index.html` - Tabbed interface with Overview, Rules, Logs, and Settings
- `source-schemas.js` - Platform field definitions for rule builder

**Key UI Features**:
- Auto-saving form drafts during rule creation
- Real-time message log display with filtering
- Configuration export/import functionality
- Session persistence (remembers active tab, preferences)

### Message Flow

1. **OneComme** captures chat messages from platforms
2. **Platform Handlers** parse raw messages into standardized format
3. **Rule Engine** evaluates conditions and determines routing
4. **Message Logger** records processing details
5. **OSC Client** sends structured JSON to target applications
6. **Web UI** displays real-time processing status

### OSC Message Structure

All outgoing messages follow a consistent JSON format:
```json
{
  "timestamp": "ISO 8601 timestamp",
  "service": "youtube|bilibili|niconico", 
  "type": "comment|superchat|gift",
  "user": {"id": "", "name": "", "display_name": ""},
  "message": {"content": "", "id": ""},
  "platform_data": {"amount": "", "currency": "", "is_member": true},
  "processing": {"rule_matched": "", "endpoint": "", "processed_at": ""}
}
```

## Key Development Patterns

### Error Handling
- All async operations use try-catch with fallback behaviors
- Configuration loading has automatic default fallback
- OSC sending includes retry logic and connection health checks
- Web UI shows user-friendly error notifications

### Logging Strategy
- Console logging with emoji prefixes for easy identification (`📥` incoming, `📤` outgoing)
- Structured message logging with timestamps and processing details
- Debug logging controlled via configuration flags
- Log rotation and retention management

### Plugin Integration
The plugin exports specific functions that OneComme expects:
- Message event handlers for each platform
- Plugin metadata and configuration
- Lifecycle management (start/stop/reload)

### State Management
- Configuration changes are immediately persisted
- UI state (active tabs, form drafts) saved automatically
- Message logs maintained in memory with configurable limits
- Rule modifications trigger immediate re-evaluation

## Common Development Tasks

### Adding New Platform Support
1. Create new handler in `impl/[platform]/`
2. Implement standardized message parsing classes
3. Update `plugin.js` to import new handlers
4. Add platform-specific fields to `source-schemas.js`
5. Update rule builder UI to support new message types

### Creating Custom Rule Types
1. Extend condition operators in rule evaluation logic
2. Add new action types beyond `route_to_endpoint`
3. Update web UI rule builder with new options
4. Test with various message scenarios

### Debugging OSC Issues
1. Use `node tests/osc-monitor.js` to verify message delivery
2. Check target application's OSC input configuration
3. Verify network/firewall settings for UDP traffic
4. Use web UI logs tab for real-time message inspection

## Configuration Notes

### Environment Variables
- `OSC_PORT` - Override default OSC output port (19100)
- `WEB_UI_PORT` - Override web interface port (19101)  
- `DEBUG_LOGGING` - Enable verbose debug output

### Default OSC Endpoints
- `/onecomme/youtube/comment` - YouTube comments
- `/onecomme/youtube/superchat` - YouTube Super Chats
- `/onecomme/bilibili/comment` - Bilibili comments
- `/onecomme/bilibili/gift` - Bilibili gifts
- `/onecomme/niconico/comment` - Niconico comments
- `/onecomme/twitch/comment` - Twitch chat messages
- `/onecomme/twitch/subscription` - Twitch subscriptions (including gift subs)
- `/onecomme/twitch/bits` - Twitch bits/cheering events
- `/onecomme/twitch/raid` - Twitch raids and hosts

### File Structure Impact
- Plugin must be in OneComme's plugins directory
- All dependencies bundled (no npm install needed for end users)
- Configuration files created automatically in plugin root
- Web UI files served statically from `web-ui/` directory

This plugin demonstrates advanced Node.js patterns including event-driven architecture, sophisticated rule engines, real-time web interfaces, and plugin-based extensibility systems.