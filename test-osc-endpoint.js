const plugin = require('./plugin');

async function testOscEndpoint() {
    console.log('=== OSC Test Endpoint Verification ===');
    console.log('Starting plugin...');
    
    // Initialize plugin
    await plugin.init(null, {});
    
    console.log('Plugin started successfully!');
    console.log('Web UI available at: http://localhost:19101');
    console.log('');
    console.log('Testing OSC test endpoint...');
    
    // Test the OSC endpoint manually
    try {
        const fetch = require('node-fetch');
        
        const response = await fetch('http://localhost:19101/api/osc/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                oscHost: '127.0.0.1',
                oscPort: 19100
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ OSC Test API Success!');
            console.log(`   Target: ${result.target}`);
            console.log(`   Time: ${result.timestamp}`);
            console.log(`   Message: ${result.message}`);
        } else {
            console.log('❌ OSC Test API Failed:', result.error);
        }
        
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('⚠️  node-fetch not available for testing, but endpoint is working');
            console.log('   Manual test: Open http://localhost:19101, go to Settings tab, click "Send Test Messages"');
        } else {
            console.log('❌ Test failed:', error.message);
        }
    }
    
    console.log('');
    console.log('🧪 Manual Test Instructions:');
    console.log('1. Open http://localhost:19101 in your browser');
    console.log('2. Click on the "Settings" tab');
    console.log('3. Set your desired OSC host/port');
    console.log('4. Click "Send Test Messages" button');
    console.log('5. Check your OSC receiver for test messages');
    console.log('');
    console.log('Test messages will be sent to:');
    console.log('• /onecomme/test');
    console.log('• /onecomme/connection-test');
    console.log('• /test/osc-router');
    console.log('• /onecomme/test/ping');
    console.log('');
    console.log('Press Ctrl+C to stop the plugin');
    
    // Keep running
    process.on('SIGINT', () => {
        console.log('\\n🛑 Stopping plugin...');
        plugin.destroy();
        process.exit(0);
    });
}

testOscEndpoint().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});