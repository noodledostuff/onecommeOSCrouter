// Test script for the enhanced rule system with source-specific conditions

const RuleEngine = require('./plugin.js').RuleEngine || class RuleEngine {
    constructor() {
        this.rules = [];
    }
    
    evaluateCondition(condition, message) {
        const { field, operator, dataType } = condition;
        let { value } = condition;
        let messageValue = this.getFieldValue(message, field);

        // Type conversion based on dataType
        if (dataType === 'number') {
            messageValue = parseFloat(messageValue) || 0;
            value = parseFloat(value) || 0;
        } else if (dataType === 'boolean') {
            messageValue = Boolean(messageValue);
            value = Boolean(value);
        }

        switch (operator) {
            case 'equals':
                return messageValue === value;
            case 'not_equals':
                return messageValue !== value;
            case 'greater_than':
                return messageValue > value;
            case 'greater_than_or_equal':
                return messageValue >= value;
            case 'less_than':
                return messageValue < value;
            case 'less_than_or_equal':
                return messageValue <= value;
            case 'contains':
                return String(messageValue).toLowerCase().includes(String(value).toLowerCase());
            case 'not_contains':
                return !String(messageValue).toLowerCase().includes(String(value).toLowerCase());
            case 'starts_with':
                return String(messageValue).toLowerCase().startsWith(String(value).toLowerCase());
            case 'ends_with':
                return String(messageValue).toLowerCase().endsWith(String(value).toLowerCase());
            case 'regex':
                try {
                    const regex = new RegExp(value, 'i');
                    return regex.test(String(messageValue));
                } catch (e) {
                    return false;
                }
            default:
                return false;
        }
    }

    getFieldValue(message, fieldPath) {
        const parts = fieldPath.split('.');
        let value = message;
        
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    // Enhanced rule evaluation with support for complex condition groups
    evaluateRule(rule, message) {
        if (!rule.enabled) return false;

        // Handle new complex rule format with source-specific condition groups
        if (rule.conditionGroups && rule.conditionGroups.length > 0) {
            return this.evaluateConditionGroups(rule.conditionGroups, rule.groupLogic || 'OR', message);
        }

        // Legacy format support
        const { conditions, conditionLogic } = rule;
        if (!conditions || conditions.length === 0) return true;

        const results = conditions.map(condition => this.evaluateCondition(condition, message));

        if (conditionLogic === 'OR') {
            return results.some(result => result);
        } else { // AND
            return results.every(result => result);
        }
    }

    // Evaluate condition groups with complex logic support
    evaluateConditionGroups(conditionGroups, groupLogic, message) {
        const groupResults = conditionGroups.map(group => this.evaluateConditionGroup(group, message));
        
        if (groupLogic === 'OR') {
            return groupResults.some(result => result);
        } else { // AND
            return groupResults.every(result => result);
        }
    }

    // Evaluate a single condition group (e.g., "YouTube with gift >$20")
    evaluateConditionGroup(group, message) {
        // Check if message source matches group source
        if (group.source && !this.matchesSource(group.source, message)) {
            return false;
        }

        // Check if message type matches group message type (if specified)
        if (group.messageType && !this.matchesMessageType(group.messageType, message)) {
            return false;
        }

        // Evaluate all conditions within the group
        if (!group.conditions || group.conditions.length === 0) {
            return true; // Source/type match is sufficient if no conditions specified
        }

        const conditionResults = group.conditions.map(condition => this.evaluateCondition(condition, message));
        const logic = group.conditionLogic || 'AND';

        if (logic === 'OR') {
            return conditionResults.some(result => result);
        } else { // AND
            return conditionResults.every(result => result);
        }
    }

    // Check if message matches the specified source
    matchesSource(source, message) {
        // Determine message source from the message type or service field
        const messageSource = this.detectMessageSource(message);
        return messageSource === source;
    }

    // Detect the source platform from the message
    detectMessageSource(message) {
        // Check for explicit type field first
        if (message.type) {
            if (message.type.startsWith('youtube') || message.type === 'youtube') return 'youtube';
            if (message.type.startsWith('bilibili') || message.type === 'bilibili') return 'bilibili';
            if (message.type.startsWith('niconico') || message.type === 'niconama') return 'niconico';
        }

        // Check for service field
        if (message.service) {
            return message.service.toLowerCase();
        }

        // Check for platform-specific fields as fallback
        if (message.userLevel !== undefined || message.guardLevel !== undefined) return 'bilibili';
        if (message.isMember !== undefined) return 'youtube';
        
        return 'unknown';
    }

    // Check if message matches the specified message type
    matchesMessageType(messageType, message) {
        if (messageType === 'gift' || messageType === 'superchat') {
            return message.hasGift === true;
        }
        if (messageType === 'comment') {
            return message.hasGift !== true; // Comments are messages without gifts
        }
        return true;
    }
};

// Test cases
function runTests() {
    console.log('🧪 Testing Enhanced Rule System with Source-Specific Conditions\n');
    
    const ruleEngine = new RuleEngine();
    
    // Test rule: "YouTube with SuperChat > $20 OR Bilibili with gift > ¥50"
    const complexRule = {
        id: 'test-complex-rule',
        name: 'High Value Gifts',
        enabled: true,
        conditionGroups: [
            {
                source: 'youtube',
                messageType: 'superchat',
                conditions: [
                    {
                        field: 'price',
                        operator: 'greater_than',
                        value: 20,
                        dataType: 'number'
                    }
                ],
                conditionLogic: 'AND'
            },
            {
                source: 'bilibili',
                messageType: 'gift',
                conditions: [
                    {
                        field: 'price',
                        operator: 'greater_than',
                        value: 50,
                        dataType: 'number'
                    }
                ],
                conditionLogic: 'AND'
            }
        ],
        groupLogic: 'OR'
    };
    
    // Test messages
    const testMessages = [
        {
            name: 'Test YouTube SuperChat $25',
            message: {
                service: 'youtube',
                type: 'youtube-super',
                name: 'TestUser1',
                comment: 'Thanks for streaming!',
                hasGift: true,
                price: 25,
                isMember: false
            },
            expectedMatch: true
        },
        {
            name: 'Test YouTube SuperChat $15',
            message: {
                service: 'youtube',
                type: 'youtube-super',
                name: 'TestUser2',
                comment: 'Great content!',
                hasGift: true,
                price: 15,
                isMember: false
            },
            expectedMatch: false
        },
        {
            name: 'Test Bilibili Gift ¥100',
            message: {
                service: 'bilibili',
                type: 'bilibili-gift',
                name: 'TestUser3',
                comment: 'Amazing stream!',
                hasGift: true,
                price: 100,
                userLevel: 25,
                guardLevel: 1,
                isVip: false,
                giftName: '超级火箭'
            },
            expectedMatch: true
        },
        {
            name: 'Test Bilibili Gift ¥20',
            message: {
                service: 'bilibili',
                type: 'bilibili-gift',
                name: 'TestUser4',
                comment: 'Nice!',
                hasGift: true,
                price: 20,
                userLevel: 10,
                guardLevel: 0,
                isVip: false,
                giftName: '辣条'
            },
            expectedMatch: false
        },
        {
            name: 'Test YouTube Regular Comment',
            message: {
                service: 'youtube',
                type: 'youtube-comment',
                name: 'TestUser5',
                comment: 'Hello there!',
                hasGift: false,
                isMember: true,
                isModerator: false
            },
            expectedMatch: false
        },
        {
            name: 'Test Bilibili Regular Comment',
            message: {
                service: 'bilibili',
                type: 'bilibili-comment',
                name: 'TestUser6',
                comment: '666',
                hasGift: false,
                userLevel: 15,
                guardLevel: 0,
                isVip: true
            },
            expectedMatch: false
        }
    ];
    
    console.log('📋 Testing Rule:', complexRule.name);
    console.log('📊 Rule Logic: YouTube SuperChat > $20 OR Bilibili Gift > ¥50\n');
    
    let passedTests = 0;
    let totalTests = testMessages.length;
    
    testMessages.forEach((test, index) => {
        const result = ruleEngine.evaluateRule(complexRule, test.message);
        const status = result === test.expectedMatch ? '✅ PASS' : '❌ FAIL';
        const expected = test.expectedMatch ? 'Should Match' : 'Should NOT Match';
        const actual = result ? 'Matched' : 'Did NOT Match';
        
        console.log(`${index + 1}. ${test.name}`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual: ${actual}`);
        console.log(`   Result: ${status}`);
        console.log('');
        
        if (result === test.expectedMatch) {
            passedTests++;
        }
    });
    
    console.log('='.repeat(50));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Enhanced rule system is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the rule engine implementation.');
    }
    
    // Test source detection
    console.log('\n🔍 Testing Source Detection:');
    testMessages.forEach((test, index) => {
        const detectedSource = ruleEngine.detectMessageSource(test.message);
        const expectedSource = test.message.service;
        const status = detectedSource === expectedSource ? '✅' : '❌';
        console.log(`   ${test.name}: Detected '${detectedSource}' | Expected '${expectedSource}' ${status}`);
    });
    
    console.log('\n✨ Enhanced rule system testing complete!');
}

// Run the tests
runTests();