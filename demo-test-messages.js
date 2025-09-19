// Demo: Show what OSC test messages look like
const plugin = require('./plugin');

async function demoTestMessages() {
    console.log('=== OneComme OSC Router - Test Messages Demo ===\\n');
    
    // Initialize plugin
    await plugin.init(null, {});
    
    console.log('Simulating what happens when you click "Send Test Messages" in Settings tab:\\n');
    
    // Simulate the test message data
    const testData = {
        type: 'connection-test',
        message: 'OneComme OSC Router Connection Test',
        timestamp: new Date().toISOString(),
        host: '127.0.0.1',
        port: 19100,
        plugin: 'onecomme-osc-router',
        version: '2.0.0',
        author: 'noodledostuff'
    };
    
    console.log('📡 Test Message Data (JSON):');
    console.log(JSON.stringify(testData, null, 2));
    console.log();
    
    console.log('📍 Test messages are sent to these OSC endpoints:');
    console.log('• /onecomme/test (with JSON data above)');
    console.log('• /onecomme/connection-test (with JSON data above)');  
    console.log('• /test/osc-router (with JSON data above)');
    console.log('• /onecomme/test/ping (simple string: "OneComme OSC Router Test - Connection OK")');
    console.log();
    
    console.log('🎯 How to verify in your OSC receiver:');
    console.log('• VRChat: Check avatar parameters or world triggers');
    console.log('• TouchOSC: Monitor incoming messages in connection log');
    console.log('• OSC Monitor apps: Watch for incoming UDP packets');
    console.log('• Custom apps: Listen for OSC messages on your configured port');
    console.log();
    
    console.log('✨ Web UI Instructions:');
    console.log('1. Open http://localhost:19101');
    console.log('2. Go to Settings tab');
    console.log('3. Configure your OSC host/port');
    console.log('4. Click "Send Test Messages"');
    console.log('5. Check the status message and your OSC receiver');
    console.log();
    
    console.log('🔧 Current Configuration:');
    console.log(`   OSC Host: ${plugin.configManager.getOscHost()}`);
    console.log(`   OSC Port: ${plugin.configManager.getOscPort()}`);
    console.log();
    
    plugin.destroy();
    console.log('Demo complete! 🎉');
}

demoTestMessages().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
});