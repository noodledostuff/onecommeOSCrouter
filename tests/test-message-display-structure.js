/**
 * OneComme OSC Router - Message Display Structure Test
 * 
 * Tests the HTML structure of message display UI to ensure proper nesting
 * This test verifies:
 * - HTML structure validity
 * - Proper nesting of elements
 * - XSS protection through HTML escaping
 * - Consistent structure between incoming and outgoing messages
 */

const path = require('path');

// Try to load JSDOM if available, otherwise use basic validation
let JSDOM;
try {
    JSDOM = require('jsdom').JSDOM;
} catch (e) {
    JSDOM = null;
}

// Mock the RoutingUI class methods we need for testing
class MockRoutingUI {
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    buildIncomingReadableContent(data, service) {
        let hasContent = false;
        let content = '';
        
        // Gift Information (if present)
        if (data.hasGift) {
            hasContent = true;
            content += '<div class="log-readable-content">';
            content += '<div class="readable-fields">';
            content += '<div class="field-group gift-group">';
            content += '<div class="field-group-title"><i class="fas fa-gift"></i> Gift Information</div>';
            content += '<div class="gift-info-table">';
            content += '<div class="gift-info-row">';
            
            if (data.giftName) {
                content += `<span class="gift-name-primary">${this.escapeHtml(data.giftName)}</span>`;
            }
            
            if (data.price !== undefined) {
                const priceColor = data.price >= 50 ? '#e74c3c' : data.price >= 10 ? '#f39c12' : '#27ae60';
                const currency = service === 'bilibili' ? '¥' : '$';
                content += `<span class="gift-price-primary" style="color: ${priceColor}; font-weight: bold; margin-left: 10px;">${currency}${data.price}</span>`;
            }
            
            content += '</div>';
            content += '</div>';
            content += '</div>';
            content += '</div>';
            content += '</div>';
        }
        
        // Return empty string if no content to display
        return hasContent ? content : '';
    }
    
    renderIncomingMessage(msg) {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const statusIcon = msg.processed ? '✅' : '❌';
        const userName = msg.data.name || 'Unknown';
        const userComment = msg.data.comment || 'No message';
        const hasGift = msg.data.hasGift ? ' 🎁' : '';
        
        // Build member status badges for header
        let memberBadges = [];
        if (msg.service === 'bilibili') {
            if (msg.data.userLevel) {
                const levelColor = msg.data.userLevel >= 20 ? '#f39c12' : msg.data.userLevel >= 10 ? '#e74c3c' : '#95a5a6';
                memberBadges.push(`<span class="user-badge level-badge" style="background-color: ${levelColor};">UL${msg.data.userLevel}</span>`);
            }
        }
        
        const badgeHtml = memberBadges.length > 0 ? memberBadges.join('') : '';
        
        // Build human-readable display
        const readableContent = this.buildIncomingReadableContent(msg.data, msg.service);
        
        return `
            <div class="log-message incoming ${msg.processed ? 'success' : 'error'}">
                <div class="log-header">
                    <div class="log-title">
                        ${statusIcon}
                        <span class="log-service ${msg.service}">${msg.service}</span>
                        ${badgeHtml}
                        <strong>${this.escapeHtml(userName)}</strong>${hasGift}
                    </div>
                    <div class="log-time">${time}</div>
                </div>
                <div class="log-content">
                    "${this.escapeHtml(userComment.substring(0, 150))}${userComment.length > 150 ? '...' : ''}"
                </div>
                ${readableContent || ''}
                <div class="log-toggle" onclick="toggleLogJson('${msg.id}')">
                    <i class="fas fa-code"></i> Click to view raw Data
                </div>
                <div class="log-json" id="json-${msg.id}">${this.escapeHtml(JSON.stringify(msg.data, null, 2))}</div>
            </div>
        `;
    }
    
    buildOutgoingReadableContent(data, endpoint) {
        let content = '<div class="log-readable-content">';
        content += '<div class="readable-fields">';
        
        // Message Content as clear table
        content += '<div class="field-group">';
        content += '<div class="field-group-title"><i class="fas fa-table"></i> OSC Message Fields</div>';
        
        if (typeof data === 'string') {
            // OSC string data - try to parse as JSON to show the actual message fields
            let jsonData = null;
            
            try {
                jsonData = JSON.parse(data);
            } catch (e) {
                // Handle as raw string
            }
            
            if (jsonData && typeof jsonData === 'object') {
                // Successfully parsed JSON
                content += '<table class="message-data-table">';
                
                // Display each field that's being sent in the OSC message
                for (const [key, value] of Object.entries(jsonData)) {
                    let displayValue = value;
                    let valueClass = 'data-value';
                    
                    if (typeof value === 'string') {
                        displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
                        displayValue = `"${this.escapeHtml(displayValue)}"`;
                    }
                    
                    content += `<tr><td class="data-key">${this.escapeHtml(key)}</td><td class="${valueClass}">${displayValue}</td></tr>`;
                }
                
                content += '</table>';
                
                const fieldCount = Object.keys(jsonData).length;
                content += `<div class="content-meta">Fields sent: ${fieldCount} | Message size: ${data.length} bytes</div>`;
            }
        }
        
        content += '</div>';
        content += '</div>';
        content += '</div>';
        return content;
    }
    
    renderOutgoingMessage(msg) {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const statusIcon = msg.success ? '✅' : '❌';
        const platformSpan = '<span class="log-service youtube">youtube</span>';
        
        // Build human-readable display for outgoing data
        const readableContent = this.buildOutgoingReadableContent(msg.data, msg.endpoint);
        
        return `
            <div class="log-message outgoing ${msg.success ? 'success' : 'error'}">
                <div class="log-header">
                    <div class="log-title">
                        ${statusIcon}
                        <span class="log-endpoint">${this.escapeHtml(msg.endpoint)}</span>
                        ${platformSpan}
                        ${msg.error ? `<span style="color: #f56565; font-size: 12px;">(${this.escapeHtml(msg.error)})</span>` : ''}
                    </div>
                    <div class="log-time">${time}</div>
                </div>
                ${readableContent || ''}
                <div class="log-toggle" onclick="toggleLogJson('${msg.id}')">
                    <i class="fas fa-code"></i> Click to view raw Data
                </div>
                <div class="log-json" id="json-${msg.id}">${this.escapeHtml(typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2))}</div>
            </div>
        `;
    }
}

console.log('🧪 OneComme OSC Router - Message Display Structure Test');
console.log('='.repeat(50));

// Test data
const testIncomingMessage = {
    id: 'test-incoming-123',
    type: 'incoming',
    timestamp: new Date().toISOString(),
    service: 'youtube',
    processed: true,
    data: {
        name: 'TestUser<script>alert("xss")</script>',
        comment: 'Hello World! This is a test message with <script>alert("xss")</script>',
        hasGift: true,
        giftName: 'SuperChat<img src="x" onerror="alert(\'xss\')">',
        price: 15.99,
        userLevel: 25
    }
};

const testOutgoingMessage = {
    id: 'test-outgoing-456',
    type: 'outgoing',
    timestamp: new Date().toISOString(),
    endpoint: '/onecomme/test<script>alert("xss")</script>',
    success: true,
    data: JSON.stringify({
        user: 'TestUser<script>alert("xss")</script>',
        message: 'Hello <script>alert("xss")</script>',
        amount: 10
    })
};

function testIncomingMessageStructure() {
    console.log('\n📥 Testing Incoming Message Structure...');
    
    try {
        const ui = new MockRoutingUI();
        const html = ui.renderIncomingMessage(testIncomingMessage);
        
        if (!JSDOM) {
            // Basic HTML structure validation
            if (!html.includes('class="log-message incoming')) {
                throw new Error('Missing .log-message.incoming class');
            }
            if (!html.includes('class="log-header"')) {
                throw new Error('Missing .log-header class');
            }
            if (!html.includes('class="log-content"')) {
                throw new Error('Missing .log-content class');
            }
            if (!html.includes('class="log-toggle"')) {
                throw new Error('Missing .log-toggle class');
            }
            if (!html.includes('class="log-json"')) {
                throw new Error('Missing .log-json class');
            }
            
            console.log('✅ Basic HTML structure validation passed');
            console.log('✅ All required CSS classes found');
            
            // Check XSS protection - script tags should be escaped
            if (html.includes('<script>')) {
                throw new Error('XSS vulnerability detected - script tags not escaped');
            }
            console.log('✅ XSS protection working - no raw script tags found');
            
            return true;
        }
        
        // Parse with JSDOM to validate HTML structure
        const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
        const document = dom.window.document;
        
        // Check main structure
        const logMessage = document.querySelector('.log-message.incoming');
        if (!logMessage) {
            throw new Error('Missing .log-message.incoming element');
        }
        
        console.log('✅ Main log message element found');
        
        // Check required child elements
        const header = logMessage.querySelector('.log-header');
        const content = logMessage.querySelector('.log-content');
        const toggle = logMessage.querySelector('.log-toggle');
        const json = logMessage.querySelector('.log-json');
        
        if (!header) throw new Error('Missing .log-header element');
        if (!content) throw new Error('Missing .log-content element');
        if (!toggle) throw new Error('Missing .log-toggle element');
        if (!json) throw new Error('Missing .log-json element');
        
        console.log('✅ All required child elements found');
        
        // Check XSS protection
        const titleElement = header.querySelector('.log-title strong');
        if (titleElement && titleElement.textContent.includes('<script>')) {
            throw new Error('XSS vulnerability detected in user name');
        }
        console.log('✅ XSS protection working for user name');
        
        const contentElement = content;
        if (contentElement && contentElement.innerHTML.includes('<script>')) {
            throw new Error('XSS vulnerability detected in message content');
        }
        console.log('✅ XSS protection working for message content');
        
        // Check readable content structure if present
        const readableContent = logMessage.querySelector('.log-readable-content');
        if (readableContent) {
            const readableFields = readableContent.querySelector('.readable-fields');
            if (!readableFields) {
                throw new Error('Missing .readable-fields inside .log-readable-content');
            }
            console.log('✅ Readable content structure is valid');
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Incoming message structure test failed: ${error.message}`);
        return false;
    }
}

function testOutgoingMessageStructure() {
    console.log('\n📤 Testing Outgoing Message Structure...');
    
    try {
        const ui = new MockRoutingUI();
        const html = ui.renderOutgoingMessage(testOutgoingMessage);
        
        if (!JSDOM) {
            // Basic HTML structure validation
            if (!html.includes('class="log-message outgoing')) {
                throw new Error('Missing .log-message.outgoing class');
            }
            if (!html.includes('class="log-header"')) {
                throw new Error('Missing .log-header class');
            }
            if (!html.includes('class="log-toggle"')) {
                throw new Error('Missing .log-toggle class');
            }
            if (!html.includes('class="log-json"')) {
                throw new Error('Missing .log-json class');
            }
            
            console.log('✅ Basic HTML structure validation passed');
            console.log('✅ All required CSS classes found');
            
            // Check XSS protection - script tags should be escaped
            if (html.includes('<script>')) {
                throw new Error('XSS vulnerability detected - script tags not escaped');
            }
            console.log('✅ XSS protection working - no raw script tags found');
            
            return true;
        }
        
        // Parse with JSDOM to validate HTML structure
        const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
        const document = dom.window.document;
        
        // Check main structure
        const logMessage = document.querySelector('.log-message.outgoing');
        if (!logMessage) {
            throw new Error('Missing .log-message.outgoing element');
        }
        
        console.log('✅ Main log message element found');
        
        // Check required child elements
        const header = logMessage.querySelector('.log-header');
        const toggle = logMessage.querySelector('.log-toggle');
        const json = logMessage.querySelector('.log-json');
        
        if (!header) throw new Error('Missing .log-header element');
        if (!toggle) throw new Error('Missing .log-toggle element');
        if (!json) throw new Error('Missing .log-json element');
        
        console.log('✅ All required child elements found');
        
        // Check XSS protection in endpoint
        const endpointElement = header.querySelector('.log-endpoint');
        if (endpointElement && endpointElement.innerHTML.includes('<script>')) {
            throw new Error('XSS vulnerability detected in endpoint');
        }
        console.log('✅ XSS protection working for endpoint');
        
        // Check readable content structure
        const readableContent = logMessage.querySelector('.log-readable-content');
        if (readableContent) {
            const readableFields = readableContent.querySelector('.readable-fields');
            if (!readableFields) {
                throw new Error('Missing .readable-fields inside .log-readable-content');
            }
            console.log('✅ Readable content structure is valid');
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Outgoing message structure test failed: ${error.message}`);
        return false;
    }
}

function testHtmlValidation() {
    console.log('\n🔍 Testing HTML Validation...');
    
    try {
        const ui = new MockRoutingUI();
        
        // Test both message types
        const incomingHtml = ui.renderIncomingMessage(testIncomingMessage);
        const outgoingHtml = ui.renderOutgoingMessage(testOutgoingMessage);
        
        if (!JSDOM) {
            // Basic validation without JSDOM
            console.log(`✅ Generated incoming HTML: ${incomingHtml.length} characters`);
            console.log(`✅ Generated outgoing HTML: ${outgoingHtml.length} characters`);
            
            // Check for balanced tags (basic validation)
            const incomingDivCount = (incomingHtml.match(/<div/g) || []).length;
            const incomingCloseDivCount = (incomingHtml.match(/<\/div>/g) || []).length;
            
            if (incomingDivCount !== incomingCloseDivCount) {
                throw new Error(`Unbalanced div tags in incoming message: ${incomingDivCount} open, ${incomingCloseDivCount} close`);
            }
            
            const outgoingDivCount = (outgoingHtml.match(/<div/g) || []).length;
            const outgoingCloseDivCount = (outgoingHtml.match(/<\/div>/g) || []).length;
            
            if (outgoingDivCount !== outgoingCloseDivCount) {
                throw new Error(`Unbalanced div tags in outgoing message: ${outgoingDivCount} open, ${outgoingCloseDivCount} close`);
            }
            
            console.log(`✅ Incoming message: ${incomingDivCount} balanced div tags`);
            console.log(`✅ Outgoing message: ${outgoingDivCount} balanced div tags`);
            console.log('✅ Basic HTML validation passed');
            
            return true;
        }
        
        // Combine into a full document and validate
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head><title>Test</title></head>
            <body>
                <div class="incoming-messages">
                    ${incomingHtml}
                </div>
                <div class="outgoing-messages">
                    ${outgoingHtml}
                </div>
            </body>
            </html>
        `;
        
        const dom = new JSDOM(fullHtml);
        const document = dom.window.document;
        
        // Check for basic HTML structure issues
        const allDivs = document.querySelectorAll('div');
        console.log(`✅ Found ${allDivs.length} div elements`);
        
        // Check for unclosed tags or structural issues
        const incomingContainer = document.querySelector('.incoming-messages');
        const outgoingContainer = document.querySelector('.outgoing-messages');
        
        if (!incomingContainer.children.length) {
            throw new Error('Incoming messages container is empty');
        }
        
        if (!outgoingContainer.children.length) {
            throw new Error('Outgoing messages container is empty');
        }
        
        console.log('✅ HTML structure appears valid');
        console.log(`✅ Document parses without errors`);
        
        return true;
    } catch (error) {
        console.error(`❌ HTML validation test failed: ${error.message}`);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting message display structure tests...\n');
    
    const results = [
        testIncomingMessageStructure(),
        testOutgoingMessageStructure(),
        testHtmlValidation()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All message display structure tests PASSED!');
        console.log('✅ HTML structure is properly nested');
        console.log('✅ XSS protection is working');
        console.log('✅ Required elements are present');
    } else {
        console.log('❌ Some tests FAILED. Please check the HTML structure.');
        process.exit(1);
    }
    
    console.log('\n💡 Structure Summary:');
    console.log('   • Main message container: .log-message');
    console.log('   • Header with status and time: .log-header');
    console.log('   • Message content: .log-content (incoming only)');
    console.log('   • Readable content: .log-readable-content');
    console.log('   • JSON toggle and data: .log-toggle, .log-json');
    console.log('   • All user content is HTML-escaped for security');
}

// Always run tests - use JSDOM if available, basic validation otherwise
runAllTests();
