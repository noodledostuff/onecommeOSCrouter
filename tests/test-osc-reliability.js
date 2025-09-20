// Comprehensive OSC Reliability Test Script
// This test simulates various scenarios to identify OSC sending issues

const { Client, Message } = require('node-osc');
const fs = require('fs');
const path = require('path');

class OSCReliabilityTester {
    constructor() {
        this.testResults = [];
        this.client = null;
        this.testCount = 0;
        this.successCount = 0;
        this.errorCount = 0;
    }

    async runAllTests() {
        console.log('🧪 OneComme OSC Router - Reliability Test Suite');
        console.log('=' .repeat(55));
        console.log('');

        const tests = [
            { name: 'Basic OSC Client Creation', fn: () => this.testClientCreation() },
            { name: 'Message Creation', fn: () => this.testMessageCreation() },
            { name: 'Single Message Send', fn: () => this.testSingleMessageSend() },
            { name: 'Multiple Message Send', fn: () => this.testMultipleMessageSend() },
            { name: 'Large Message Send', fn: () => this.testLargeMessageSend() },
            { name: 'Unicode Message Send', fn: () => this.testUnicodeMessageSend() },
            { name: 'Invalid Endpoint Handling', fn: () => this.testInvalidEndpoints() },
            { name: 'Client Reconnection', fn: () => this.testClientReconnection() },
            { name: 'Concurrent Message Send', fn: () => this.testConcurrentMessageSend() },
            { name: 'Error Recovery', fn: () => this.testErrorRecovery() }
        ];

        for (const test of tests) {
            await this.runTest(test.name, test.fn);
            await this.delay(100); // Small delay between tests
        }

        this.printSummary();
        
        // Clean up
        if (this.client) {
            try {
                this.client.close();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }

    async runTest(name, testFn) {
        console.log(`🔬 Running: ${name}`);
        this.testCount++;

        try {
            const result = await testFn();
            if (result.success) {
                console.log(`   ✅ ${name} - PASSED`);
                this.successCount++;
            } else {
                console.log(`   ❌ ${name} - FAILED: ${result.error}`);
                this.errorCount++;
            }
            this.testResults.push({ name, ...result });
        } catch (error) {
            console.log(`   💥 ${name} - CRASHED: ${error.message}`);
            this.errorCount++;
            this.testResults.push({ name, success: false, error: error.message });
        }
        console.log('');
    }

    async testClientCreation() {
        try {
            if (this.client) {
                this.client.close();
            }
            
            this.client = new Client('127.0.0.1', 19100);
            
            // Check if client was created successfully
            if (this.client) {
                return { success: true, message: 'OSC client created successfully' };
            } else {
                return { success: false, error: 'Client creation returned null/undefined' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testMessageCreation() {
        try {
            const testData = { test: 'message', timestamp: Date.now() };
            const jsonData = JSON.stringify(testData);
            const utf8Data = Buffer.from(jsonData, 'utf-8');
            
            const message = new Message('/test/endpoint', utf8Data);
            
            if (message) {
                return { success: true, message: `Message created with ${utf8Data.length} bytes` };
            } else {
                return { success: false, error: 'Message creation returned null/undefined' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testSingleMessageSend() {
        try {
            if (!this.client) {
                throw new Error('No client available');
            }

            const testData = { 
                test: 'single_message',
                timestamp: Date.now(),
                message: 'Hello OSC World!'
            };
            const jsonData = JSON.stringify(testData);
            const utf8Data = Buffer.from(jsonData, 'utf-8');
            const message = new Message('/onecomme/test/single', utf8Data);

            this.client.send(message);
            
            return { success: true, message: `Single message sent (${utf8Data.length} bytes)` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testMultipleMessageSend() {
        try {
            if (!this.client) {
                throw new Error('No client available');
            }

            const messageCount = 5;
            const results = [];

            for (let i = 0; i < messageCount; i++) {
                const testData = { 
                    test: 'multiple_message',
                    index: i,
                    timestamp: Date.now(),
                    message: `Message ${i + 1} of ${messageCount}`
                };
                const jsonData = JSON.stringify(testData);
                const utf8Data = Buffer.from(jsonData, 'utf-8');
                const message = new Message('/onecomme/test/multiple', utf8Data);

                this.client.send(message);
                results.push(utf8Data.length);
                
                // Small delay between sends
                await this.delay(10);
            }
            
            const totalBytes = results.reduce((sum, bytes) => sum + bytes, 0);
            return { success: true, message: `${messageCount} messages sent (${totalBytes} total bytes)` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testLargeMessageSend() {
        try {
            if (!this.client) {
                throw new Error('No client available');
            }

            // Create a large message (simulate a detailed comment with lots of data)
            const largeTestData = {
                test: 'large_message',
                timestamp: Date.now(),
                user: {
                    name: 'TestUser',
                    displayName: 'Test User Display Name',
                    profileImage: 'https://example.com/very/long/url/to/profile/image.jpg',
                    level: 50,
                    badges: ['member', 'moderator', 'vip', 'subscriber'],
                    stats: {
                        totalMessages: 12345,
                        totalDonations: 67890,
                        followDuration: '2 years, 3 months, 15 days'
                    }
                },
                message: 'This is a very long message that simulates what might happen when a user sends a detailed comment with lots of emoji and special characters! 😀😃😄😁😆😅😂🤣☺️😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👹👺🤡💩👻💀☠️👽👾🤖🎃😺😸😹😻😼😽🙀😿😾',
                metadata: {
                    platform: 'YouTube',
                    streamTitle: 'Amazing Stream with Very Long Title That Goes On and On',
                    category: 'Gaming',
                    viewers: 1234,
                    duration: '2:34:56',
                    quality: '1080p60',
                    language: 'en-US'
                }
            };

            const jsonData = JSON.stringify(largeTestData);
            const utf8Data = Buffer.from(jsonData, 'utf-8');
            const message = new Message('/onecomme/test/large', utf8Data);

            this.client.send(message);
            
            return { success: true, message: `Large message sent (${utf8Data.length} bytes)` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testUnicodeMessageSend() {
        try {
            if (!this.client) {
                throw new Error('No client available');
            }

            const unicodeTestData = {
                test: 'unicode_message',
                timestamp: Date.now(),
                messages: {
                    chinese: '你好世界！这是一个测试消息。',
                    japanese: 'こんにちは世界！これはテストメッセージです。',
                    korean: '안녕하세요 세계! 이것은 테스트 메시지입니다.',
                    arabic: 'مرحبا بالعالم! هذه رسالة تجريبية.',
                    emoji: '🌍🌎🌏👋🚀⭐🎉🎊🎈🎁🎂🍰🎪🎨🎭🎵🎶🎸🎹🎺🎻🥁',
                    special: '∀x∈ℝ: ⌊x⌋ ≤ x < ⌊x⌋ + 1 → ∑ᵢ₌₁ⁿ i² = n(n+1)(2n+1)/6'
                }
            };

            const jsonData = JSON.stringify(unicodeTestData);
            const utf8Data = Buffer.from(jsonData, 'utf-8');
            const message = new Message('/onecomme/test/unicode', utf8Data);

            this.client.send(message);
            
            return { success: true, message: `Unicode message sent (${utf8Data.length} bytes)` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testInvalidEndpoints() {
        try {
            if (!this.client) {
                throw new Error('No client available');
            }

            const invalidEndpoints = [
                '', // empty
                'no-slash', // no leading slash
                '/', // just slash
                '//', // double slash
                '/test/端點', // unicode in endpoint
                '/test with spaces', // spaces
                '/test\n\t/newlines' // newlines and tabs
            ];

            let errorCount = 0;
            for (const endpoint of invalidEndpoints) {
                try {
                    const testData = { test: 'invalid_endpoint', endpoint: endpoint };
                    const jsonData = JSON.stringify(testData);
                    const utf8Data = Buffer.from(jsonData, 'utf-8');
                    const message = new Message(endpoint, utf8Data);
                    
                    this.client.send(message);
                    // If we get here, the invalid endpoint was accepted (might be ok for some)
                } catch (error) {
                    errorCount++;
                    // Expected for some invalid endpoints
                }
            }
            
            return { success: true, message: `Invalid endpoint test completed (${errorCount}/${invalidEndpoints.length} rejected)` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testClientReconnection() {
        try {
            // Close current client
            if (this.client) {
                this.client.close();
                this.client = null;
            }

            // Wait a moment
            await this.delay(100);

            // Recreate client
            this.client = new Client('127.0.0.1', 19100);

            // Test sending after reconnection
            const testData = { test: 'reconnection', timestamp: Date.now() };
            const jsonData = JSON.stringify(testData);
            const utf8Data = Buffer.from(jsonData, 'utf-8');
            const message = new Message('/onecomme/test/reconnection', utf8Data);

            this.client.send(message);
            
            return { success: true, message: 'Client reconnection and send successful' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testConcurrentMessageSend() {
        try {
            if (!this.client) {
                throw new Error('No client available');
            }

            const concurrentCount = 10;
            const promises = [];

            for (let i = 0; i < concurrentCount; i++) {
                const promise = (async (index) => {
                    const testData = { 
                        test: 'concurrent',
                        index: index,
                        timestamp: Date.now()
                    };
                    const jsonData = JSON.stringify(testData);
                    const utf8Data = Buffer.from(jsonData, 'utf-8');
                    const message = new Message('/onecomme/test/concurrent', utf8Data);

                    this.client.send(message);
                    return utf8Data.length;
                })(i);
                
                promises.push(promise);
            }

            const results = await Promise.all(promises);
            const totalBytes = results.reduce((sum, bytes) => sum + bytes, 0);
            
            return { success: true, message: `${concurrentCount} concurrent messages sent (${totalBytes} total bytes)` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testErrorRecovery() {
        try {
            // Simulate error by trying to send to an invalid port
            const errorClient = new Client('127.0.0.1', 99999); // Invalid port
            
            let errorCaught = false;
            try {
                const testData = { test: 'error_recovery', timestamp: Date.now() };
                const jsonData = JSON.stringify(testData);
                const utf8Data = Buffer.from(jsonData, 'utf-8');
                const message = new Message('/onecomme/test/error', utf8Data);
                
                errorClient.send(message);
                // Note: node-osc might not throw immediately on invalid ports
            } catch (error) {
                errorCaught = true;
            }

            // Close the error client
            try {
                errorClient.close();
            } catch (e) {
                // Ignore cleanup errors
            }

            // Now test recovery with valid client
            if (!this.client) {
                this.client = new Client('127.0.0.1', 19100);
            }

            const recoveryData = { test: 'recovery', timestamp: Date.now() };
            const jsonData = JSON.stringify(recoveryData);
            const utf8Data = Buffer.from(jsonData, 'utf-8');
            const message = new Message('/onecomme/test/recovery', utf8Data);
            
            this.client.send(message);
            
            return { success: true, message: 'Error recovery test completed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printSummary() {
        console.log('=' .repeat(55));
        console.log('📊 Test Summary');
        console.log('=' .repeat(55));
        console.log(`Total Tests: ${this.testCount}`);
        console.log(`✅ Passed: ${this.successCount}`);
        console.log(`❌ Failed: ${this.errorCount}`);
        console.log(`Success Rate: ${((this.successCount / this.testCount) * 100).toFixed(1)}%`);
        console.log('');

        if (this.errorCount > 0) {
            console.log('🔍 Failed Tests:');
            this.testResults
                .filter(result => !result.success)
                .forEach(result => {
                    console.log(`   • ${result.name}: ${result.error}`);
                });
            console.log('');
        }

        console.log('💡 Recommendations:');
        if (this.errorCount === 0) {
            console.log('   ✅ OSC reliability appears to be good!');
        } else {
            console.log('   ⚠️  Some OSC operations failed - check error details above');
            console.log('   🔧 Consider implementing retry logic for failed sends');
            console.log('   📊 Monitor OSC client connection status');
        }
        
        console.log('');
        console.log('🔍 What to check if messages are missing:');
        console.log('   1. OSC receiver software is running and listening on correct port');
        console.log('   2. Firewall/antivirus is not blocking UDP traffic');
        console.log('   3. OneComme plugin is receiving messages from chat platforms');
        console.log('   4. Rule engine is not blocking default endpoint messages');
        console.log('   5. OSC client is connecting to correct host:port');
        console.log('   6. Message size is not exceeding OSC/UDP limits');
        console.log('');
    }
}

// Run the tests
const tester = new OSCReliabilityTester();
tester.runAllTests().catch(error => {
    console.error('Test suite crashed:', error.message);
    process.exit(1);
});