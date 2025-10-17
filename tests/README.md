# OneComme OSC Router - Tests

This directory contains test scripts to verify the functionality of the OneComme OSC Router plugin.

## Available Tests

### test-config-persistence.js
Tests the configuration persistence system to ensure all user settings are properly saved and loaded.

**What it tests:**
- Configuration file creation and loading
- Settings updates and validation
- Automatic backup creation
- UI preferences simulation
- Export functionality

**Usage:**
```bash
node tests/test-config-persistence.js
```

### test-osc-reliability.js
Comprehensive OSC message delivery testing to verify the reliability of the OSC communication pipeline.

**What it tests:**
- OSC client creation and message sending
- Different message types and formats
- Large message handling
- Unicode content support
- Error handling and recovery
- Concurrent message sending

**Usage:**
```bash
node tests/test-osc-reliability.js
```

### test-osc-message-formats.js
Tests OSC message format handling and emoji removal functionality.

**What it tests:**
- Configuration system for OSC message format settings
- Binary vs UTF-8 string message format creation
- Unicode character handling in both formats
- Emoji removal functionality (HTML tags and Unicode emojis)
- Message format comparison and validation

**Usage:**
```bash
node tests/test-osc-message-formats.js
```

### osc-monitor.js
Real-time OSC message monitor for debugging and verification purposes.

**What it does:**
- Creates an OSC server to receive and display messages
- Shows detailed message information including timestamps
- Tracks message statistics and patterns
- Exports logs for analysis
- Provides diagnostic information

**Usage:**
```bash
node tests/osc-monitor.js
```

Press Ctrl+C to stop monitoring and see final statistics.

## Running All Tests

To run all tests in sequence:

```bash
# Test configuration system
node tests/test-config-persistence.js

# Test OSC reliability
node tests/test-osc-reliability.js

# Test message formats and emoji removal
node tests/test-osc-message-formats.js

# For live monitoring (run separately)
node tests/osc-monitor.js
```

## Test Results

All tests should pass with:
- Configuration persistence: 100% success rate
- OSC reliability: 100% message delivery
- Message formats: Binary and string format validation
- Emoji removal: Successful removal of HTML tags and Unicode emojis
- Monitor: Real-time message display

If any tests fail, check:
1. Node.js version (16.0.0 or higher required)
2. Network permissions (UDP traffic)
3. File system permissions in plugin directory
4. Port availability (19100, 19101)

## Integration with OneComme

These tests can be run independently of OneComme to verify the core functionality. For full integration testing:

1. Start OneComme with the OSC Router plugin
2. Run `osc-monitor.js` to watch for real messages
3. Generate chat messages in your streaming platform
4. Verify messages appear in the monitor

This helps diagnose whether issues are in the plugin or the receiving application.