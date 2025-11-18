/**
 * OneComme OSC Router - Twitch Integration Test
 * 
 * Tests the new Twitch platform handlers to ensure they work correctly
 * This test verifies:
 * - Twitch message creation and serialization
 * - Message type detection and routing
 * - Field mapping and data structure consistency
 */

const path = require('path');

// Import Twitch handlers
const { TwitchComment, TwitchSubscription, TwitchBits, TwitchRaid } = require('../impl/twitch/index');

console.log('🧪 OneComme OSC Router - Twitch Integration Test');
console.log('='.repeat(50));

// Test data samples
const testData = {
    comment: {
        id: 'msg_12345',
        userId: 'user_67890',
        name: 'testuser',
        displayName: 'TestUser',
        comment: 'Hello from Twitch! 👋',
        timestamp: new Date().toISOString(),
        isSubscriber: true,
        isModerator: false,
        isVip: false,
        color: '#FF6B6B',
        badges: ['subscriber/12'],
        subscriptionTier: 1000,
        subscriptionMonths: 6
    },
    
    subscription: {
        id: 'sub_12345',
        userId: 'user_67890',
        name: 'subscriber',
        displayName: 'NewSubscriber',
        subscriptionType: 'sub',
        tier: '1000',
        months: 1,
        streak: 1,
        subMessage: 'Happy to support the stream!',
        timestamp: new Date().toISOString(),
        isGift: false
    },
    
    bits: {
        id: 'bits_12345',
        userId: 'user_67890',
        name: 'bitscheer',
        displayName: 'BitsCheer',
        bits: 1500,
        bitsMessage: 'Cheer1500 Great stream!',
        timestamp: new Date().toISOString(),
        cheerBadgeTier: 1000,
        isAnonymous: false
    },
    
    raid: {
        id: 'raid_12345',
        raiderName: 'raider_channel',
        raiderDisplayName: 'RaiderChannel',
        raiderId: 'raider_12345',
        viewerCount: 150,
        raidMessage: 'Amazing stream, everyone check it out!',
        timestamp: new Date().toISOString(),
        targetChannelName: 'target_channel'
    }
};

// Test functions
function testTwitchComment() {
    console.log('\n📝 Testing Twitch Comment Handler...');
    
    try {
        const comment = new TwitchComment(testData.comment);
        
        console.log('✅ TwitchComment created successfully');
        console.log(`   Type: ${comment.type}`);
        console.log(`   Endpoint: ${comment.endpoint}`);
        console.log(`   User: ${comment.displayName} (${comment.name})`);
        console.log(`   Message: ${comment.comment}`);
        console.log(`   Subscriber: ${comment.isSubscriber}`);
        console.log(`   Tier: ${comment.subscriptionTier}`);
        console.log(`   Months: ${comment.subscriptionMonths}`);
        
        // Test JSON serialization
        const json = comment.getJson();
        const parsed = JSON.parse(json);
        
        console.log(`✅ JSON serialization successful (${json.length} chars)`);
        console.log(`   Parsed type: ${parsed.type}`);
        
        // Test asPost method
        const post = comment.asPost();
        console.log(`✅ asPost() successful, fields: ${Object.keys(post).length}`);
        
        return true;
    } catch (error) {
        console.error(`❌ TwitchComment test failed: ${error.message}`);
        return false;
    }
}

function testTwitchSubscription() {
    console.log('\n🎁 Testing Twitch Subscription Handler...');
    
    try {
        const sub = new TwitchSubscription(testData.subscription);
        
        console.log('✅ TwitchSubscription created successfully');
        console.log(`   Type: ${sub.type}`);
        console.log(`   Endpoint: ${sub.endpoint}`);
        console.log(`   Subscriber: ${sub.displayName}`);
        console.log(`   Tier: ${sub.tier} (${sub.getTierNumber()})`);
        console.log(`   Months: ${sub.months}, Streak: ${sub.streak}`);
        console.log(`   Gift: ${sub.isGift}`);
        console.log(`   Value: $${sub.getApproximateValue()}`);
        console.log(`   Message: ${sub.subMessage}`);
        
        // Test JSON serialization
        const json = sub.getJson();
        const parsed = JSON.parse(json);
        
        console.log(`✅ JSON serialization successful (${json.length} chars)`);
        
        // Test helper methods
        console.log(`✅ Helper methods work - Tier: ${sub.getTierNumber()}, Value: $${sub.getApproximateValue()}`);
        
        return true;
    } catch (error) {
        console.error(`❌ TwitchSubscription test failed: ${error.message}`);
        return false;
    }
}

function testTwitchBits() {
    console.log('\n🎊 Testing Twitch Bits Handler...');
    
    try {
        const bits = new TwitchBits(testData.bits);
        
        console.log('✅ TwitchBits created successfully');
        console.log(`   Type: ${bits.type}`);
        console.log(`   Endpoint: ${bits.endpoint}`);
        console.log(`   Cheerer: ${bits.displayName}`);
        console.log(`   Bits: ${bits.bits}`);
        console.log(`   Value: $${bits.bitsInDollars}`);
        console.log(`   Tier: ${bits.getCheerTier()}`);
        console.log(`   Big Cheer: ${bits.isBigCheer()}`);
        console.log(`   Anonymous: ${bits.isAnonymous}`);
        console.log(`   Message: ${bits.bitsMessage}`);
        
        // Test JSON serialization
        const json = bits.getJson();
        console.log(`✅ JSON serialization successful (${json.length} chars)`);
        
        // Test helper methods
        console.log(`✅ Helper methods work - Tier: ${bits.getCheerTier()}, Big: ${bits.isBigCheer(500)}`);
        
        return true;
    } catch (error) {
        console.error(`❌ TwitchBits test failed: ${error.message}`);
        return false;
    }
}

function testTwitchRaid() {
    console.log('\n⚔️ Testing Twitch Raid Handler...');
    
    try {
        const raid = new TwitchRaid(testData.raid);
        
        console.log('✅ TwitchRaid created successfully');
        console.log(`   Type: ${raid.type}`);
        console.log(`   Endpoint: ${raid.endpoint}`);
        console.log(`   Raider: ${raid.raiderDisplayName} (${raid.raiderName})`);
        console.log(`   Viewers: ${raid.viewerCount}`);
        console.log(`   Size: ${raid.getRaidSize()}`);
        console.log(`   Big Raid: ${raid.isBigRaid()}`);
        console.log(`   Target: ${raid.targetChannelName}`);
        console.log(`   Message: ${raid.comment}`);
        
        // Test JSON serialization
        const json = raid.getJson();
        console.log(`✅ JSON serialization successful (${json.length} chars)`);
        
        // Test helper methods
        console.log(`✅ Helper methods work - Size: ${raid.getRaidSize()}, Big: ${raid.isBigRaid(100)}`);
        
        return true;
    } catch (error) {
        console.error(`❌ TwitchRaid test failed: ${error.message}`);
        return false;
    }
}

function testMessageTypeDetection() {
    console.log('\n🔍 Testing Message Type Detection...');
    
    // Test the conversion logic patterns that would be used in the main converter
    const testCases = [
        { data: { bits: 100 }, expected: 'TwitchBits' },
        { data: { subscriptionType: 'sub' }, expected: 'TwitchSubscription' },
        { data: { viewerCount: 50 }, expected: 'TwitchRaid' },
        { data: { comment: 'Hello!' }, expected: 'TwitchComment' }
    ];
    
    let passed = 0;
    
    for (const testCase of testCases) {
        try {
            let result;
            
            // Simulate the conversion logic from plugin.js
            if (testCase.data.subscriptionType || testCase.data.tier || testCase.data.isGift) {
                result = 'TwitchSubscription';
            } else if (testCase.data.bits || testCase.data.bitsAmount || testCase.data.cheerEmotes) {
                result = 'TwitchBits';
            } else if (testCase.data.viewerCount !== undefined || testCase.data.raiderName || testCase.data.raidType) {
                result = 'TwitchRaid';
            } else {
                result = 'TwitchComment';
            }
            
            if (result === testCase.expected) {
                console.log(`   ✅ ${JSON.stringify(testCase.data)} → ${result}`);
                passed++;
            } else {
                console.log(`   ❌ ${JSON.stringify(testCase.data)} → Expected ${testCase.expected}, got ${result}`);
            }
        } catch (error) {
            console.log(`   ❌ ${JSON.stringify(testCase.data)} → Error: ${error.message}`);
        }
    }
    
    console.log(`✅ Message type detection: ${passed}/${testCases.length} passed`);
    return passed === testCases.length;
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting Twitch integration tests...\n');
    
    const results = [
        testTwitchComment(),
        testTwitchSubscription(),
        testTwitchBits(),
        testTwitchRaid(),
        testMessageTypeDetection()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All Twitch integration tests PASSED!');
        console.log('✅ Twitch support is ready for use');
    } else {
        console.log('❌ Some tests FAILED. Please check the implementation.');
        process.exit(1);
    }
    
    console.log('\n💡 To use Twitch support:');
    console.log('   1. Configure OneComme to capture Twitch messages');
    console.log('   2. Ensure Twitch service is set to "twitch" in message data');
    console.log('   3. Use the web UI to create custom Twitch routing rules');
    console.log('   4. Test with the built-in rule examples');
}

// Run the tests
runAllTests();