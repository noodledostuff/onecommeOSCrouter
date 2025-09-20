// Standalone OSC Message Monitor
// This script creates an OSC server to receive and monitor messages

const osc = require('node-osc');
const fs = require('fs');

class OSCMessageMonitor {
    constructor(port = 19100) {
        this.port = port;
        this.server = null;
        this.receivedMessages = [];
        this.messageCount = 0;
        this.startTime = null;
        this.lastMessageTime = null;
        
        // Statistics
        this.stats = {
            totalMessages: 0,
            uniqueEndpoints: new Set(),
            messageTypes: new Map(),
            platforms: new Map(),
            averageInterval: 0,
            largestMessage: 0,
            smallestMessage: Infinity
        };
        
        this.setupServer();
    }

    setupServer() {
        try {
            this.server = new osc.Server(this.port, '127.0.0.1');
            
            this.server.on('message', (msg) => {
                this.handleMessage(msg);
            });
            
            this.server.on('error', (error) => {
                console.error('🚨 OSC Server Error:', error.message);
            });
            
            console.log(`🎧 OSC Monitor listening on port ${this.port}`);
            console.log('📡 Waiting for OneComme messages...');
            console.log('   (Make sure OneComme plugin is running and sending to 127.0.0.1:19100)');
            console.log('');
            
        } catch (error) {
            console.error('❌ Failed to create OSC server:', error.message);
            process.exit(1);
        }
    }

    handleMessage(msg) {
        const timestamp = Date.now();
        const [address, ...args] = msg;
        
        this.messageCount++;
        this.stats.totalMessages++;
        
        if (this.startTime === null) {
            this.startTime = timestamp;
            console.log('🎉 First message received! Starting monitoring...');
            console.log('');
        }
        
        // Calculate interval since last message
        let interval = 0;
        if (this.lastMessageTime !== null) {
            interval = timestamp - this.lastMessageTime;
        }
        this.lastMessageTime = timestamp;
        
        // Update statistics
        this.stats.uniqueEndpoints.add(address);
        
        // Parse message content
        let messageData = null;
        let messageSize = 0;
        
        try {
            if (args.length > 0 && Buffer.isBuffer(args[0])) {
                const jsonString = args[0].toString('utf-8');
                messageData = JSON.parse(jsonString);
                messageSize = args[0].length;
                
                // Track message types and platforms
                if (messageData.type) {
                    const count = this.stats.messageTypes.get(messageData.type) || 0;
                    this.stats.messageTypes.set(messageData.type, count + 1);
                }
                
                if (messageData.platform) {
                    const count = this.stats.platforms.get(messageData.platform) || 0;
                    this.stats.platforms.set(messageData.platform, count + 1);
                }
                
                // Track message sizes
                if (messageSize > this.stats.largestMessage) {
                    this.stats.largestMessage = messageSize;
                }
                if (messageSize < this.stats.smallestMessage) {
                    this.stats.smallestMessage = messageSize;
                }
            }
        } catch (error) {
            // Message might not be JSON or might have different format
            messageSize = args.reduce((size, arg) => {
                if (Buffer.isBuffer(arg)) return size + arg.length;
                if (typeof arg === 'string') return size + Buffer.byteLength(arg, 'utf-8');
                return size + 8; // Estimate for numbers/other types
            }, 0);
        }
        
        // Store message for analysis
        this.receivedMessages.push({
            timestamp,
            address,
            args: args.length,
            size: messageSize,
            interval,
            data: messageData
        });
        
        // Display message info
        this.displayMessage(address, messageData, messageSize, interval);
        
        // Display periodic stats
        if (this.messageCount % 10 === 0) {
            this.displayStats();
        }
    }

    displayMessage(address, data, size, interval) {
        const timestamp = new Date().toLocaleTimeString();
        let messageInfo = `📨 [${timestamp}] ${address}`;
        
        if (data) {
            const preview = this.createMessagePreview(data);
            messageInfo += ` - ${preview}`;
        }
        
        messageInfo += ` (${size} bytes`;
        
        if (interval > 0) {
            messageInfo += `, +${interval}ms`;
        }
        
        messageInfo += ')';
        
        console.log(messageInfo);
        
        // Warn about potential issues
        if (interval > 5000) {
            console.log('   ⚠️  Long gap since last message (>5s)');
        }
        
        if (size > 8192) {
            console.log('   ⚠️  Large message size (>8KB)');
        }
    }

    createMessagePreview(data) {
        if (!data) return '(binary data)';
        
        let preview = '';
        
        if (data.type) {
            preview += data.type;
        }
        
        if (data.platform) {
            preview += ` [${data.platform}]`;
        }
        
        if (data.user && data.user.name) {
            preview += ` ${data.user.name}`;
        }
        
        if (data.message) {
            const msg = data.message.length > 50 
                ? data.message.substring(0, 50) + '...' 
                : data.message;
            preview += `: "${msg}"`;
        }
        
        if (data.amount) {
            preview += ` ($${data.amount})`;
        }
        
        return preview || '(structured data)';
    }

    displayStats() {
        const now = Date.now();
        const runtime = this.startTime ? (now - this.startTime) / 1000 : 0;
        const rate = runtime > 0 ? (this.stats.totalMessages / runtime).toFixed(2) : 0;
        
        console.log('');
        console.log('📊 Statistics:');
        console.log(`   Messages: ${this.stats.totalMessages} (${rate} msg/sec)`);
        console.log(`   Unique Endpoints: ${this.stats.uniqueEndpoints.size}`);
        console.log(`   Runtime: ${runtime.toFixed(1)}s`);
        
        if (this.stats.messageTypes.size > 0) {
            console.log('   Message Types:');
            for (const [type, count] of this.stats.messageTypes.entries()) {
                console.log(`     - ${type}: ${count}`);
            }
        }
        
        if (this.stats.platforms.size > 0) {
            console.log('   Platforms:');
            for (const [platform, count] of this.stats.platforms.entries()) {
                console.log(`     - ${platform}: ${count}`);
            }
        }
        
        if (this.stats.largestMessage > 0) {
            console.log(`   Message Sizes: ${this.stats.smallestMessage}-${this.stats.largestMessage} bytes`);
        }
        
        console.log('');
    }

    exportLog(filename) {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                runtime: this.startTime ? (Date.now() - this.startTime) / 1000 : 0,
                statistics: {
                    totalMessages: this.stats.totalMessages,
                    uniqueEndpoints: Array.from(this.stats.uniqueEndpoints),
                    messageTypes: Object.fromEntries(this.stats.messageTypes),
                    platforms: Object.fromEntries(this.stats.platforms),
                    largestMessage: this.stats.largestMessage,
                    smallestMessage: this.stats.smallestMessage === Infinity ? 0 : this.stats.smallestMessage
                },
                messages: this.receivedMessages.map(msg => ({
                    timestamp: new Date(msg.timestamp).toISOString(),
                    address: msg.address,
                    args: msg.args,
                    size: msg.size,
                    interval: msg.interval,
                    preview: msg.data ? this.createMessagePreview(msg.data) : null
                }))
            };
            
            fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
            console.log(`💾 Log exported to ${filename}`);
        } catch (error) {
            console.error('❌ Failed to export log:', error.message);
        }
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('\n🛑 OSC Monitor stopped');
            
            // Display final statistics
            this.displayStats();
            
            // Offer to export log
            const filename = `osc-monitor-${Date.now()}.json`;
            this.exportLog(filename);
        }
    }
}

// Handle process termination gracefully
let monitor = null;

function gracefulShutdown() {
    console.log('\n🔄 Shutting down gracefully...');
    if (monitor) {
        monitor.stop();
    }
    process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Main execution
function main() {
    const args = process.argv.slice(2);
    const port = args.find(arg => arg.startsWith('--port='))?.split('=')[1] || 19100;
    
    console.log('🎧 OneComme OSC Message Monitor');
    console.log('=' .repeat(50));
    console.log('');
    console.log('This tool monitors OSC messages sent from the OneComme plugin.');
    console.log('It will help identify if messages are being sent correctly.');
    console.log('');
    console.log('Instructions:');
    console.log('1. Make sure OneComme is running with the OSC Router plugin');
    console.log('2. Start a stream or use test messages in OneComme');
    console.log('3. Messages should appear below in real-time');
    console.log('4. Press Ctrl+C to stop monitoring and see final statistics');
    console.log('');
    
    monitor = new OSCMessageMonitor(parseInt(port));
}

main();
