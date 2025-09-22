// Source-Specific Condition Schemas for Enhanced Rule Builder
// This defines what fields and conditions are available for each platform
// Fields are categorized as common (shared across platforms) or platform-exclusive

// Common fields shared across all platforms
const CommonFields = {
    name: { name: 'name', label: 'User Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
    comment: { name: 'comment', label: 'Message Text', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
    displayName: { name: 'displayName', label: 'Display Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
    hasGift: { name: 'hasGift', label: 'Has Gift', type: 'boolean', operators: ['equals'] },
    isOwner: { name: 'isOwner', label: 'Is Channel Owner', type: 'boolean', operators: ['equals'] },
    profileImageUrl: { name: 'profileImageUrl', label: 'Profile Image URL', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'] },
    timestamp: { name: 'timestamp', label: 'Message Timestamp', type: 'string', operators: ['equals', 'not_equals'] }
};

// Platform-exclusive field definitions
const PlatformFields = {
    youtube: {
        isModerator: { name: 'isModerator', label: 'Is Moderator', type: 'boolean', operators: ['equals'] },
        isMember: { name: 'isMember', label: 'Is Channel Member', type: 'boolean', operators: ['equals'] },
        autoModerated: { name: 'autoModerated', label: 'Auto Moderated', type: 'boolean', operators: ['equals'] }
    },
    bilibili: {
        userLevel: { name: 'userLevel', label: 'User Level', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        medalLevel: { name: 'medalLevel', label: 'Medal Level', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        medalName: { name: 'medalName', label: 'Medal Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
        isVip: { name: 'isVip', label: 'Is VIP', type: 'boolean', operators: ['equals'] },
        isSvip: { name: 'isSvip', label: 'Is SVIP', type: 'boolean', operators: ['equals'] },
        guardLevel: { name: 'guardLevel', label: 'Guard Level (0=none, 1=总督, 2=提督, 3=舰长)', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        fansMedal: { name: 'fansMedal', label: 'Fans Medal', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains'] }
    },
    niconico: {
        // Niconico-specific fields can be added here as they become available
    },
    twitch: {
        isSubscriber: { name: 'isSubscriber', label: 'Is Subscriber', type: 'boolean', operators: ['equals'] },
        isVip: { name: 'isVip', label: 'Is VIP', type: 'boolean', operators: ['equals'] },
        isModerator: { name: 'isModerator', label: 'Is Moderator', type: 'boolean', operators: ['equals'] },
        isPartner: { name: 'isPartner', label: 'Is Partner', type: 'boolean', operators: ['equals'] },
        isAffiliate: { name: 'isAffiliate', label: 'Is Affiliate', type: 'boolean', operators: ['equals'] },
        isTurbo: { name: 'isTurbo', label: 'Has Turbo', type: 'boolean', operators: ['equals'] },
        isPrime: { name: 'isPrime', label: 'Has Prime', type: 'boolean', operators: ['equals'] },
        isStaff: { name: 'isStaff', label: 'Is Staff', type: 'boolean', operators: ['equals'] },
        isGlobalMod: { name: 'isGlobalMod', label: 'Is Global Moderator', type: 'boolean', operators: ['equals'] },
        userType: { name: 'userType', label: 'User Type', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains'] },
        subscriptionTier: { name: 'subscriptionTier', label: 'Subscription Tier (1000, 2000, 3000)', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        subscriptionMonths: { name: 'subscriptionMonths', label: 'Subscription Months', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        channelName: { name: 'channelName', label: 'Channel Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
        firstMsg: { name: 'firstMsg', label: 'Is First Time Chatter', type: 'boolean', operators: ['equals'] },
        returning: { name: 'returning', label: 'Is Returning Chatter', type: 'boolean', operators: ['equals'] },
        color: { name: 'color', label: 'Username Color', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains'] }
    }
};

// Message type specific fields (shared across platforms when applicable)
const MessageTypeFields = {
    gift: {
        price: { name: 'price', label: 'Gift Price', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        giftName: { name: 'giftName', label: 'Gift Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
        quantity: { name: 'quantity', label: 'Gift Quantity', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] }
    },
    superchat: {
        price: { name: 'price', label: 'SuperChat Amount', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        currency: { name: 'currency', label: 'Currency', type: 'string', operators: ['equals', 'not_equals'] },
        significance: { name: 'significance', label: 'Significance Level', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] }
    },
    subscription: {
        tier: { name: 'tier', label: 'Subscription Tier', type: 'string', operators: ['equals', 'not_equals'] },
        months: { name: 'months', label: 'Total Months', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        streak: { name: 'streak', label: 'Streak Months', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        isGift: { name: 'isGift', label: 'Is Gift Sub', type: 'boolean', operators: ['equals'] },
        multiMonthGift: { name: 'multiMonthGift', label: 'Multi-Month Gift', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        massGiftCount: { name: 'massGiftCount', label: 'Mass Gift Count', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] }
    },
    bits: {
        bits: { name: 'bits', label: 'Bits Amount', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        bitsInDollars: { name: 'bitsInDollars', label: 'Bits Value (USD)', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        cheerBadgeTier: { name: 'cheerBadgeTier', label: 'Cheer Badge Tier', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        isAnonymous: { name: 'isAnonymous', label: 'Is Anonymous Cheer', type: 'boolean', operators: ['equals'] },
        isPinned: { name: 'isPinned', label: 'Is Pinned Cheer', type: 'boolean', operators: ['equals'] }
    },
    raid: {
        viewerCount: { name: 'viewerCount', label: 'Raid Viewer Count', type: 'number', operators: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'] },
        raiderName: { name: 'raiderName', label: 'Raider Name', type: 'string', operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex'] },
        isHosting: { name: 'isHosting', label: 'Is Host (Legacy)', type: 'boolean', operators: ['equals'] }
    }
};

const SourceSchemas = {
    // YouTube message schema
    youtube: {
        name: 'YouTube',
        color: '#ff0000',
        icon: 'fab fa-youtube',
        messageTypes: ['comment', 'superchat'],
        defaultEndpoints: ['/onecomme/youtube/comment', '/onecomme/youtube/super']
    },

    // Bilibili message schema
    bilibili: {
        name: 'Bilibili',
        color: '#00a1d6',
        icon: 'fas fa-tv',
        messageTypes: ['comment', 'gift'],
        defaultEndpoints: ['/onecomme/bilibili/comment', '/onecomme/bilibili/gift']
    },

    // Niconico message schema  
    niconico: {
        name: 'Niconico Live',
        color: '#ff6600',
        icon: 'fas fa-video',
        messageTypes: ['comment', 'gift'],
        defaultEndpoints: ['/onecomme/niconico/comment']
    },

    // Twitch message schema
    twitch: {
        name: 'Twitch',
        color: '#9146ff',
        icon: 'fab fa-twitch',
        messageTypes: ['comment', 'subscription', 'bits', 'raid'],
        defaultEndpoints: ['/onecomme/twitch/comment', '/onecomme/twitch/subscription', '/onecomme/twitch/bits', '/onecomme/twitch/raid']
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
        
        let fields = [];
        
        // Add common fields (available to all platforms)
        fields = fields.concat(Object.values(CommonFields).map(field => ({
            ...field,
            category: 'common',
            platforms: ['all']
        })));
        
        // Add platform-specific fields
        if (PlatformFields[source]) {
            fields = fields.concat(Object.values(PlatformFields[source]).map(field => ({
                ...field,
                category: 'platform',
                platforms: [source]
            })));
        }
        
        // Add message type specific fields
        if (messageType && MessageTypeFields[messageType]) {
            fields = fields.concat(Object.values(MessageTypeFields[messageType]).map(field => ({
                ...field,
                category: 'message-type',
                platforms: ['all'],
                messageType: messageType
            })));
        }
        
        return fields;
    },

    // Get all available output fields for multiple sources
    getAvailableOutputFields(sources = []) {
        if (sources.length === 0) return [];
        
        let allFields = {};
        
        // Always include common fields
        Object.values(CommonFields).forEach(field => {
            allFields[field.name] = {
                ...field,
                category: 'common',
                platforms: ['all'],
                available: true
            };
        });
        
        // Add platform-specific fields for selected sources
        sources.forEach(source => {
            if (PlatformFields[source]) {
                Object.values(PlatformFields[source]).forEach(field => {
                    allFields[field.name] = {
                        ...field,
                        category: 'platform',
                        platforms: [source],
                        available: true
                    };
                });
            }
        });
        
        // Add message type fields that might be available
        Object.keys(MessageTypeFields).forEach(messageType => {
            Object.values(MessageTypeFields[messageType]).forEach(field => {
                if (!allFields[field.name]) {
                    allFields[field.name] = {
                        ...field,
                        category: 'message-type',
                        platforms: ['all'],
                        messageType: messageType,
                        available: true
                    };
                }
            });
        });
        
        return Object.values(allFields);
    },

    // Get field metadata including platform exclusivity
    getFieldMetadata(fieldName, sources = []) {
        // Check if it's a common field
        if (CommonFields[fieldName]) {
            return {
                ...CommonFields[fieldName],
                category: 'common',
                platforms: ['all'],
                exclusive: false
            };
        }
        
        // Check platform-specific fields
        for (const source of Object.keys(PlatformFields)) {
            if (PlatformFields[source][fieldName]) {
                return {
                    ...PlatformFields[source][fieldName],
                    category: 'platform',
                    platforms: [source],
                    exclusive: true,
                    available: sources.length === 0 || sources.includes(source)
                };
            }
        }
        
        // Check message type fields
        for (const messageType of Object.keys(MessageTypeFields)) {
            if (MessageTypeFields[messageType][fieldName]) {
                return {
                    ...MessageTypeFields[messageType][fieldName],
                    category: 'message-type',
                    platforms: ['all'],
                    messageType: messageType,
                    exclusive: false
                };
            }
        }
        
        return null;
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

    // Check if field is available for given sources
    isFieldAvailableForSources(fieldName, sources) {
        const metadata = this.getFieldMetadata(fieldName, sources);
        if (!metadata) return false;
        
        // Common fields are always available
        if (metadata.category === 'common') return true;
        
        // Message type fields are available if any source supports them
        if (metadata.category === 'message-type') return true;
        
        // Platform-specific fields require the specific platform to be selected
        if (metadata.category === 'platform') {
            return sources.some(source => metadata.platforms.includes(source));
        }
        
        return false;
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