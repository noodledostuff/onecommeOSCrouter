/**
 * OneComme OSC Router - OSC Message Format Test
 * 
 * Tests the new OSC message format toggle functionality
 * This test verifies:
 * - Configuration setting for message format
 * - Binary blob message creation
 * - String message creation
 * - OSC message compatibility
 */

const path = require('path');
const { Message } = require('node-osc');

// Import the main plugin to test configuration
const plugin = require('../plugin.js');

console.log('🧪 OneComme OSC Router - OSC Message Format Test');
console.log('='.repeat(50));

// Test data
const testJsonData = {
    type: 'test',
    message: 'Hello OSC! 👋',
    timestamp: new Date().toISOString(),
    user: 'TestUser',
    value: 42,
    special: 'Special chars: 日本語 🎵 ñaña'
};

function testConfigurationSetting() {
    console.log('\n⚙️ Testing Configuration Setting...');
    
    try {
        const configManager = plugin.configManager;
        
        // Test getting default value
        const defaultFormat = configManager.getOscMessageFormat();
        console.log(`✅ Default format: ${defaultFormat}`);
        
        // Test setting binary format
        configManager.updateOscMessageFormat('binary');
        const binaryFormat = configManager.getOscMessageFormat();
        console.log(`✅ Binary format set: ${binaryFormat}`);
        
        // Test setting string format
        configManager.updateOscMessageFormat('string');
        const stringFormat = configManager.getOscMessageFormat();
        console.log(`✅ String format set: ${stringFormat}`);
        
        // Test invalid format (should throw error)
        try {
            configManager.updateOscMessageFormat('invalid');
            console.log('❌ Should have thrown error for invalid format');
            return false;
        } catch (error) {
            console.log(`✅ Correctly rejected invalid format: ${error.message}`);
        }
        
        // Reset to binary
        configManager.updateOscMessageFormat('binary');
        
        return true;
    } catch (error) {
        console.error(`❌ Configuration test failed: ${error.message}`);
        return false;
    }
}

function testBinaryMessage() {
    console.log('\n📦 Testing Binary Message Format...');
    
    try {
        const jsonString = JSON.stringify(testJsonData);
        const binaryData = Buffer.from(jsonString, 'utf-8');
        
        console.log(`✅ JSON string length: ${jsonString.length} characters`);
        console.log(`✅ Binary buffer length: ${binaryData.length} bytes`);
        console.log(`✅ Sample JSON: ${jsonString.substring(0, 100)}...`);
        
        // Test OSC Message creation with binary data
        const oscMessage = new Message('/test/binary', binaryData);
        console.log(`✅ OSC Message created successfully`);
        console.log(`   Address: ${oscMessage.address}`);
        console.log(`   Arguments length: ${oscMessage.args.length}`);
        console.log(`   First argument type: ${typeof oscMessage.args[0]}`);
        console.log(`   First argument length: ${oscMessage.args[0].length} bytes`);
        
        // Verify data round-trip
        const retrievedData = oscMessage.args[0];
        const retrievedJson = retrievedData.toString('utf-8');
        const retrievedObject = JSON.parse(retrievedJson);
        
        console.log(`✅ Data round-trip successful`);
        console.log(`   Retrieved type: ${retrievedObject.type}`);
        console.log(`   Retrieved special chars: ${retrievedObject.special}`);
        
        return true;
    } catch (error) {
        console.error(`❌ Binary message test failed: ${error.message}`);
        return false;
    }
}

function testStringMessage() {
    console.log('\n📝 Testing String Message Format...');
    
    try {
        const jsonString = JSON.stringify(testJsonData);
        
        console.log(`✅ JSON string length: ${jsonString.length} characters`);
        console.log(`✅ Sample JSON: ${jsonString.substring(0, 100)}...`);
        
        // Test OSC Message creation with string data
        const oscMessage = new Message('/test/string', jsonString);
        console.log(`✅ OSC Message created successfully`);
        console.log(`   Address: ${oscMessage.address}`);
        console.log(`   Arguments length: ${oscMessage.args.length}`);
        console.log(`   First argument type: ${typeof oscMessage.args[0]}`);
        console.log(`   First argument length: ${oscMessage.args[0].length} characters`);
        
        // Verify data round-trip
        const retrievedString = oscMessage.args[0];
        const retrievedObject = JSON.parse(retrievedString);
        
        console.log(`✅ Data round-trip successful`);
        console.log(`   Retrieved type: ${retrievedObject.type}`);
        console.log(`   Retrieved special chars: ${retrievedObject.special}`);
        
        return true;
    } catch (error) {
        console.error(`❌ String message test failed: ${error.message}`);
        return false;
    }
}

function testFormatComparison() {
    console.log('\n🔍 Testing Format Comparison...');
    
    try {
        const jsonString = JSON.stringify(testJsonData);
        const binaryData = Buffer.from(jsonString, 'utf-8');
        
        // Create OSC messages in both formats
        const binaryMessage = new Message('/test/binary', binaryData);
        const stringMessage = new Message('/test/string', jsonString);
        
        console.log('📊 Comparison Results:');
        console.log(`   Binary argument type: ${typeof binaryMessage.args[0]}`);
        console.log(`   String argument type: ${typeof stringMessage.args[0]}`);
        console.log(`   Binary size: ${binaryMessage.args[0].length} bytes`);
        console.log(`   String size: ${stringMessage.args[0].length} characters`);
        console.log(`   Same content length: ${binaryMessage.args[0].length === stringMessage.args[0].length}`);
        
        // Test that both can be parsed back to the same object
        const binaryParsed = JSON.parse(binaryMessage.args[0].toString('utf-8'));
        const stringParsed = JSON.parse(stringMessage.args[0]);
        
        const sameData = JSON.stringify(binaryParsed) === JSON.stringify(stringParsed);
        console.log(`✅ Both formats preserve data integrity: ${sameData}`);
        
        // Show when each format might be preferred
        console.log('\n💡 Format Recommendations:');
        console.log('   Binary: Better for most OSC receivers, handles encoding properly');
        console.log('   String: Better for text-based OSC receivers, easier to debug');
        
        return sameData;
    } catch (error) {
        console.error(`❌ Format comparison test failed: ${error.message}`);
        return false;
    }
}

function testUnicodeHandling() {
    console.log('\n🌐 Testing Unicode Handling...');
    
    const unicodeTestData = {
        english: 'Hello World',
        japanese: '日本語のテスト',
        emoji: '🎵🎮🌟⚡',
        spanish: 'Niño señor',
        chinese: '中文测试',
        korean: '한국어 테스트',
        mixed: 'Mixed: 日本語 + emoji 🎵 + español ñ'
    };
    
    try {
        const jsonString = JSON.stringify(unicodeTestData);
        
        // Test binary format
        const binaryData = Buffer.from(jsonString, 'utf-8');
        const binaryMessage = new Message('/test/unicode/binary', binaryData);
        const binaryRetrieved = JSON.parse(binaryMessage.args[0].toString('utf-8'));
        
        // Test string format
        const stringMessage = new Message('/test/unicode/string', jsonString);
        const stringRetrieved = JSON.parse(stringMessage.args[0]);
        
        // Verify all unicode characters are preserved
        let allPreserved = true;
        for (const [key, value] of Object.entries(unicodeTestData)) {
            const binaryMatch = binaryRetrieved[key] === value;
            const stringMatch = stringRetrieved[key] === value;
            
            if (!binaryMatch || !stringMatch) {
                allPreserved = false;
                console.log(`❌ Unicode mismatch for ${key}:`);
                console.log(`   Original: ${value}`);
                console.log(`   Binary:   ${binaryRetrieved[key]} (${binaryMatch})`);
                console.log(`   String:   ${stringRetrieved[key]} (${stringMatch})`);
            } else {
                console.log(`✅ ${key}: ${value}`);
            }
        }
        
        if (allPreserved) {
            console.log('✅ All unicode characters preserved in both formats');
        }
        
        return allPreserved;
    } catch (error) {
        console.error(`❌ Unicode handling test failed: ${error.message}`);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting OSC message format tests...\n');
    
    const results = [
        testConfigurationSetting(),
        testBinaryMessage(),
        testStringMessage(),
        testFormatComparison(),
        testUnicodeHandling()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All OSC message format tests PASSED!');
        console.log('✅ Both binary and string formats work correctly');
        console.log('✅ Configuration system works properly');
        console.log('✅ Unicode handling is preserved');
    } else {
        console.log('❌ Some tests FAILED. Please check the implementation.');
        process.exit(1);
    }
    
    console.log('\n💡 Usage Summary:');
    console.log('   • Access Settings tab in web UI (http://localhost:19101)');
    console.log('   • Choose between "Binary Blob" or "UTF-8 String" format');
    console.log('   • Binary is recommended for most OSC applications');
    console.log('   • String format can be useful for debugging or text-based receivers');
    console.log('   • Setting is applied immediately to all new messages');
}

// Run the tests
runAllTests();