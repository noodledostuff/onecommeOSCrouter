const plugin = require('./plugin');

async function demoLogsTab() {
    console.log('=== OneComme OSC Router - Beautiful Logs Tab Demo ===\\n');
    
    // Initialize plugin
    await plugin.init(null, {});
    
    console.log('🎉 Plugin initialized with new Logs functionality!\\n');
    console.log('Key improvements implemented:\\n');
    
    console.log('1️⃣  REMOVED /onecomme/common endpoint');
    console.log('   ❌ No more duplicate common messages');
    console.log('   ✅ Cleaner, more targeted OSC routing\\n');
    
    console.log('2️⃣  BEAUTIFUL LOGS TAB in Web UI');
    console.log('   🎨 Two-column layout: Incoming | Outgoing');
    console.log('   🌈 Gorgeous gradients and color coding');
    console.log('   📊 Real-time message counters');
    console.log('   📱 Auto-refresh every 2 seconds\\n');
    
    console.log('3️⃣  ENHANCED CONSOLE LOGGING');
    console.log('   📥 Incoming messages with service and user info');
    console.log('   📤 Outgoing messages with endpoint and status');
    console.log('   ✅/❌ Success/error indicators\\n');
    
    console.log('4️⃣  SMART MESSAGE TRACKING');
    console.log('   💾 Stores last 100 messages in memory');
    console.log('   🔍 Click-to-expand JSON view');
    console.log('   🎯 Highlighted OSC endpoints');
    console.log('   ⏰ Timestamp display\\n');
    
    console.log('🌟 PLATFORM-SPECIFIC STYLING:');
    console.log('   🔴 YouTube: Red badges');
    console.log('   🔵 Bilibili: Blue badges');
    console.log('   🟠 Niconico: Orange badges\\n');
    
    console.log('🚀 TRY IT OUT:');
    console.log('1. Open http://localhost:19101');
    console.log('2. Click the "Logs" tab (new!)');
    console.log('3. Send some test messages or trigger rules');
    console.log('4. Watch beautiful real-time message tracking!\\n');
    
    // Simulate some messages to show in logs
    const testMessages = [
        { service: 'youtube', data: { name: 'TestUser', comment: 'Hello!', hasGift: false }},
        { service: 'bilibili', data: { name: '测试用户', comment: '你好！', hasGift: true, price: 25, giftName: '礼物' }},
        { service: 'niconama', data: { name: 'テストユーザー', comment: 'こんにちは！', hasGift: false }}
    ];
    
    console.log('📨 Simulating some messages for the logs...');
    plugin.subscribe('comments', { comments: testMessages });
    
    setTimeout(() => {
        console.log('\\n✨ Check the Logs tab now to see the beautiful message tracking!');
        console.log('   📊 Message counters updated');  
        console.log('   🎨 Beautiful color-coded entries');
        console.log('   📄 Click any message to expand JSON');
        console.log('   🗑️  Use "Clear Logs" to reset');
        console.log('\\n⭐ The Logs tab auto-refreshes - no manual refresh needed!\\n');
        
        plugin.destroy();
        console.log('Demo complete! The Logs tab is ready for production use! 🎯');
    }, 1000);
}

demoLogsTab().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
});