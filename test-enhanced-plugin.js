const plugin = require('./enhanced-plugin');

console.log("=== OneComme OSC Router Test ===");
console.log(`Plugin: ${plugin.name} v${plugin.version}`);
console.log(`Author: ${plugin.author}`);
console.log(`UID: ${plugin.uid}`);
console.log();

async function testPlugin() {
    // Initialize plugin
    console.log("🚀 Initializing plugin...");
    await plugin.init(null, {});
    
    console.log("✅ Plugin initialized successfully!");
    console.log();
    
    // Test sample comments
    console.log("📨 Testing sample comments...");
    
    const sampleComments = [
        {
            service: "youtube",
            data: {
                name: "TestUser1",
                comment: "Hello from YouTube!",
                profileImageUrl: "https://example.com/avatar1.jpg",
                timestamp: Date.now(),
                hasGift: false,
                type: "youtube-comment",
                isMember: true,
                isModerator: false
            }
        },
        {
            service: "youtube", 
            data: {
                name: "BigDonor",
                comment: "Thanks for streaming! Here's a superchat!",
                profileImageUrl: "https://example.com/avatar2.jpg",
                timestamp: Date.now(),
                hasGift: true,
                price: 25,
                type: "youtube-superchat",
                isMember: true,
                isModerator: false
            }
        },
        {
            service: "bilibili",
            data: {
                name: "哔哩用户",
                comment: "哈哈哈",
                profileImageUrl: "https://example.com/bilibili1.jpg", 
                timestamp: Date.now(),
                hasGift: true,
                price: 15,
                giftName: "辣条",
                userLevel: 25,
                guardLevel: 1,
                isVip: true,
                type: "bilibili-gift"
            }
        },
        {
            service: "bilibili",
            data: {
                name: "普通用户",
                comment: "普通留言",
                profileImageUrl: "https://example.com/bilibili2.jpg",
                timestamp: Date.now(),
                hasGift: false,
                userLevel: 5,
                guardLevel: 0,
                isVip: false,
                type: "bilibili-comment"
            }
        },
        {
            service: "niconama",
            data: {
                name: "ニコユーザー",
                comment: "ニコニコからこんにちは！",
                profileImageUrl: "https://example.com/nico1.jpg",
                timestamp: Date.now(),
                hasGift: false,
                type: "niconama-comment"
            }
        }
    ];
    
    // Process each sample comment
    sampleComments.forEach((comment, index) => {
        console.log(`📝 Processing comment ${index + 1}: ${comment.service} - ${comment.data.name}`);
    });
    
    plugin.subscribe("comments", { comments: sampleComments });
    
    console.log();
    console.log("🌐 Web UI available at: http://localhost:19101");
    console.log("🔗 OSC messages being sent to: 127.0.0.1:19100");
    console.log();
    console.log("📋 Try these test scenarios in the Web UI:");
    console.log("1. Create a rule for high-value gifts (price > $10)");
    console.log("2. Create a rule for Bilibili-only messages");
    console.log("3. Create a rule for VIP users only");
    console.log("4. Test your rules with the sample JSON messages");
    console.log();
    console.log("💡 Sample test JSON for the Web UI test tab:");
    console.log(JSON.stringify({
        type: "bilibili-gift",
        name: "TestUser",
        comment: "Thanks for streaming!",
        hasGift: true,
        price: 50,
        giftName: "辣条",
        userLevel: 25,
        guardLevel: 1,
        isVip: false
    }, null, 2));
    
    console.log();
    console.log("⏸️  Plugin will keep running... Press Ctrl+C to stop");
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down plugin...');
    plugin.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down plugin...');
    plugin.destroy();
    process.exit(0);
});

// Start the test
testPlugin().catch(error => {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
});