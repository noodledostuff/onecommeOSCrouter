// Source-Specific Condition Schemas for Enhanced Rule Builder
// This defines what fields and conditions are available for each platform

const SourceSchemas = {
    // YouTube message schema
    youtube: {
        name: 'YouTube',
        color: '#ff0000',
        icon: 'fab fa-youtube',
        messageTypes: ['comment', 'superchat'],
        commonFields: [
            { name: 'name', label: 'User Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'comment', label: 'Message Text', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'displayName', label: 'Display Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'isOwner', label: 'Is Channel Owner', type: 'boolean', operators: ['equals'] },
            { name: 'isModerator', label: 'Is Moderator', type: 'boolean', operators: ['equals'] },
            { name: 'isMember', label: 'Is Channel Member', type: 'boolean', operators: ['equals'] },
            { name: 'hasGift', label: 'Has Gift/SuperChat', type: 'boolean', operators: ['equals'] }
        ],
        specificFields: {
            superchat: [
                { name: 'price', label: 'SuperChat Amount (USD)', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
                { name: 'currency', label: 'Currency', type: 'string', operators: ['equals', 'not_equals'] },
                { name: 'significance', label: 'Significance Level', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] }
            ]
        },
        defaultEndpoints: ['/onecomme/youtube/comment', '/onecomme/youtube/super']
    },

    // Bilibili message schema
    bilibili: {
        name: 'Bilibili',
        color: '#00a1d6',
        icon: 'fas fa-tv',
        messageTypes: ['comment', 'gift'],
        commonFields: [
            { name: 'name', label: 'User Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'comment', label: 'Message Text', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'displayName', label: 'Display Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'userLevel', label: 'User Level', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
            { name: 'medalLevel', label: 'Medal Level', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
            { name: 'medalName', label: 'Medal Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'isVip', label: 'Is VIP', type: 'boolean', operators: ['equals'] },
            { name: 'isSvip', label: 'Is SVIP', type: 'boolean', operators: ['equals'] },
            { name: 'guardLevel', label: 'Guard Level (0=none, 1=总督, 2=提督, 3=舰长)', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
            { name: 'isOwner', label: 'Is Channel Owner', type: 'boolean', operators: ['equals'] },
            { name: 'hasGift', label: 'Has Gift', type: 'boolean', operators: ['equals'] }
        ],
        specificFields: {
            gift: [
                { name: 'price', label: 'Gift Price (CNY)', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
                { name: 'giftName', label: 'Gift Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
                { name: 'quantity', label: 'Gift Quantity', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] }
            ]
        },
        defaultEndpoints: ['/onecomme/bilibili/comment', '/onecomme/bilibili/gift']
    },

    // Niconico message schema  
    niconico: {
        name: 'Niconico Live',
        color: '#ff6600',
        icon: 'fas fa-video',
        messageTypes: ['comment', 'gift'],
        commonFields: [
            { name: 'name', label: 'User Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'comment', label: 'Message Text', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
            { name: 'hasGift', label: 'Has Gift', type: 'boolean', operators: ['equals'] }
        ],
        specificFields: {
            gift: [
                { name: 'price', label: 'Gift Price (JPY)', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
                { name: 'giftName', label: 'Gift Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] }
            ]
        },
        defaultEndpoints: ['/onecomme/niconico/comment']
    }
};

// Operator display mapping
const OperatorLabels = {
    'equals': 'Equals (=)',
    'not_equals': 'Not Equals (≠)',
    'greater_than': 'Greater Than (>)',
    'greater_than_or_equal': 'Greater Than or Equal (≥)',
    'less_than': 'Less Than (<)',
    'less_than_or_equal': 'Less Than or Equal (≤)',
    'contains': 'Contains',
    'not_contains': 'Does Not Contain',
    'starts_with': 'Starts With',
    'ends_with': 'Ends With',
    'regex': 'Regular Expression'
};

// Helper functions for source schema management
const SourceSchemaHelpers = {
    // Get all available fields for a source and message type
    getAvailableFields(source, messageType = null) {
        if (!SourceSchemas[source]) return [];
        
        const schema = SourceSchemas[source];
        let fields = [...schema.commonFields];
        
        if (messageType && schema.specificFields && schema.specificFields[messageType]) {
            fields = [...fields, ...schema.specificFields[messageType]];
        }
        
        return fields;
    },

    // Get available operators for a field type
    getOperatorsForField(field) {
        return field.operators || [];
    },

    // Get all sources
    getAllSources() {
        return Object.keys(SourceSchemas);
    },

    // Get source schema
    getSourceSchema(source) {
        return SourceSchemas[source] || null;
    },

    // Get field by name from source
    getField(source, fieldName, messageType = null) {
        const fields = this.getAvailableFields(source, messageType);
        return fields.find(f => f.name === fieldName) || null;
    },

    // Validate condition against schema
    validateCondition(source, messageType, fieldName, operator, value) {
        const field = this.getField(source, fieldName, messageType);
        if (!field) return { valid: false, error: 'Field not found' };
        
        if (!field.operators.includes(operator)) {
            return { valid: false, error: 'Operator not supported for this field' };
        }

        // Type validation
        if (field.type === 'number' && isNaN(parseFloat(value))) {
            return { valid: false, error: 'Value must be a number' };
        }

        if (field.type === 'boolean' && !['true', 'false'].includes(String(value).toLowerCase())) {
            return { valid: false, error: 'Value must be true or false' };
        }

        return { valid: true };
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SourceSchemas, OperatorLabels, SourceSchemaHelpers };
}