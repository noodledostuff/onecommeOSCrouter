const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Client, Message } = require('node-osc');

// Import existing implementations
const { NiconamaComment, NiconamaGift } = require('./impl/niconico');
const { YouTubeComment, YouTubeSuperChat } = require('./impl/youtube/index');
const { BilibiliComment, BilibiliGift } = require('./impl/bilibili/index');
const { TwitchComment, TwitchSubscription, TwitchBits, TwitchRaid } = require('./impl/twitch/index');

const endpoint = "127.0.0.1";
const defaultPort = 19100;
const webUIPort = 19101; // Web UI will run on this port

// Message logging system
class MessageLogger {
    constructor(maxMessages = 100) {
        this.maxMessages = maxMessages;
        this.messages = [];
    }

    logIncoming(service, data, processed = true) {
        const logEntry = {
            id: Date.now() + Math.random(),
            type: 'incoming',
            timestamp: new Date().toISOString(),
            service: service,
            data: data,
            processed: processed
        };
        
        this.messages.unshift(logEntry);
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(0, this.maxMessages);
        }
        
        console.info(`📥 Incoming [${service}]: ${data.name || 'Unknown'} - ${data.comment || 'No message'}`);
        return logEntry;
    }

    logOutgoing(endpoint, data, success = true, error = null) {
        const logEntry = {
            id: Date.now() + Math.random(),
            type: 'outgoing',
            timestamp: new Date().toISOString(),
            endpoint: endpoint,
            data: data,
            success: success,
            error: error
        };
        
        this.messages.unshift(logEntry);
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(0, this.maxMessages);
        }
        
        const status = success ? '✅' : '❌';
        const preview = typeof data === 'string' ? data.substring(0, 50) : JSON.stringify(data).substring(0, 50);
        console.info(`📤 Outgoing ${status} [${endpoint}]: ${preview}...`);
        return logEntry;
    }

    getMessages(limit = null) {
        return limit ? this.messages.slice(0, limit) : this.messages;
    }

    clearMessages() {
        this.messages = [];
    }
}

// Enhanced Configuration management with comprehensive settings persistence
class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, 'config.json');
        this.config = this.loadConfig();
        this.configVersion = '2.0.0';
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                const config = JSON.parse(data);
                
                // Migrate old config versions if needed
                const migratedConfig = this.migrateConfig(config);
                
                console.info(`📄 Loaded configuration from ${this.configPath}`);
                console.info(`   OSC Target: ${migratedConfig.oscHost}:${migratedConfig.oscPort}`);
                console.info(`   OSC Message Format: ${migratedConfig.oscMessageFormat || 'binary'}`);
                console.info(`   Default Endpoints: ${migratedConfig.enableDefaultEndpoints ? 'Enabled' : 'Disabled'}`);
                
                return migratedConfig;
            }
        } catch (error) {
            console.warn('⚠️ Failed to load configuration:', error.message);
            console.info('🔄 Creating new configuration file...');
        }
        
        // Return default configuration
        const defaultConfig = this.getDefaultConfig();
        this.saveConfig(defaultConfig);
        return defaultConfig;
    }

    getDefaultConfig() {
        return {
            // Version info for future migrations
            version: this.configVersion,
            lastUpdated: new Date().toISOString(),
            
            // OSC Output Settings
            oscPort: defaultPort,
            oscHost: endpoint,
            enableDefaultEndpoints: true,
            oscMessageFormat: 'binary', // 'binary' or 'string' - format for outgoing OSC messages
            
            // Web UI Settings
            webUI: {
                port: webUIPort,
                autoStart: true,
                theme: 'default'
            },
            
            // Message Processing Settings
            messageProcessing: {
                maxMessages: 100,
                enableDebugLogging: true,
                logIncomingMessages: true,
                logOutgoingMessages: true,
                removeEmojis: false
            },
            
            // Rule Engine Settings
            ruleEngine: {
                enableCustomRules: true,
                maxRules: 50,
                defaultConditionLogic: 'AND',
                defaultGroupLogic: 'OR'
            },
            
            // User Interface Preferences
            ui: {
                lastActiveTab: 'overview',
                showNotifications: true,
                notificationDuration: 5000,
                autoRefreshLogs: true,
                logsRefreshInterval: 2000,
                enableAnimations: true,
                compactMode: false
            },
            
            // Export/Import Settings
            export: {
                includeSystemInfo: true,
                includeRules: true,
                includeConfiguration: true,
                includeMessageLogs: false
            },
            
            // Advanced Settings
            advanced: {
                oscReconnectInterval: 5000,
                maxReconnectAttempts: 3,
                messageQueueSize: 1000,
                enableConnectionHealthCheck: true,
                connectionHealthCheckInterval: 30000
            }
        };
    }

    migrateConfig(config) {
        const currentVersion = config.version || '1.0.0';
        const defaultConfig = this.getDefaultConfig();
        
        // Merge with default config to ensure all new properties exist
        const migratedConfig = this.deepMerge(defaultConfig, config);
        
        // Update version and timestamp
        migratedConfig.version = this.configVersion;
        migratedConfig.lastUpdated = new Date().toISOString();
        
        // Version-specific migrations
        if (currentVersion === '1.0.0') {
            console.info('📈 Migrating configuration from v1.0.0 to v2.0.0');
            // Add any specific migration logic here
        }
        
        return migratedConfig;
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    saveConfig(config = null) {
        try {
            const configToSave = config || this.config;
            configToSave.lastUpdated = new Date().toISOString();
            
            // Create backup of existing config before saving
            this.createConfigBackup();
            
            fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
            console.info(`💾 Configuration saved to ${this.configPath}`);
            
        } catch (error) {
            console.error('❌ Failed to save configuration:', error.message);
            throw error;
        }
    }

    createConfigBackup() {
        try {
            if (fs.existsSync(this.configPath)) {
                const backupPath = this.configPath.replace('.json', '.backup.json');
                fs.copyFileSync(this.configPath, backupPath);
            }
        } catch (error) {
            console.warn('⚠️ Failed to create config backup:', error.message);
        }
    }

    // OSC Configuration Methods
    getOscPort() {
        return this.config.oscPort || defaultPort;
    }

    getOscHost() {
        return this.config.oscHost || endpoint;
    }
    
    getOscMessageFormat() {
        return this.config.oscMessageFormat || 'binary';
    }
    
    updateOscMessageFormat(format) {
        const validFormats = ['binary', 'string'];
        if (!validFormats.includes(format)) {
            throw new Error(`Invalid OSC message format: ${format}. Must be 'binary' or 'string'.`);
        }
        this.config.oscMessageFormat = format;
        this.saveConfig();
        console.info(`🔄 OSC message format updated to ${format}`);
        return this.config.oscMessageFormat;
    }

    updateOscPort(port) {
        const validPort = parseInt(port) || defaultPort;
        if (validPort < 1024 || validPort > 65535) {
            throw new Error(`Invalid port number: ${validPort}. Must be between 1024-65535.`);
        }
        this.config.oscPort = validPort;
        this.saveConfig();
        console.info(`🔄 OSC port updated to ${validPort}`);
        return this.config.oscPort;
    }

    updateOscHost(host) {
        const validHost = (host || endpoint).trim();
        if (!validHost) {
            throw new Error('OSC host cannot be empty');
        }
        this.config.oscHost = validHost;
        this.saveConfig();
        console.info(`🔄 OSC host updated to ${validHost}`);
        return this.config.oscHost;
    }
    
    getEnableDefaultEndpoints() {
        return this.config.enableDefaultEndpoints !== false;
    }
    
    setEnableDefaultEndpoints(enabled) {
        this.config.enableDefaultEndpoints = !!enabled;
        this.saveConfig();
        console.info(`🔄 Default endpoints ${enabled ? 'enabled' : 'disabled'}`);
        return this.config.enableDefaultEndpoints;
    }

    // UI Preferences Methods
    getUIPreference(key, defaultValue = null) {
        return this.config.ui?.[key] ?? defaultValue;
    }

    setUIPreference(key, value) {
        if (!this.config.ui) this.config.ui = {};
        this.config.ui[key] = value;
        this.saveConfig();
        return value;
    }

    getLastActiveTab() {
        return this.getUIPreference('lastActiveTab', 'overview');
    }

    setLastActiveTab(tab) {
        return this.setUIPreference('lastActiveTab', tab);
    }

    // Message Processing Settings
    getMessageProcessingSetting(key, defaultValue = null) {
        return this.config.messageProcessing?.[key] ?? defaultValue;
    }

    setMessageProcessingSetting(key, value) {
        if (!this.config.messageProcessing) this.config.messageProcessing = {};
        this.config.messageProcessing[key] = value;
        this.saveConfig();
        return value;
    }

    // Rule Engine Settings
    getRuleEngineSetting(key, defaultValue = null) {
        return this.config.ruleEngine?.[key] ?? defaultValue;
    }

    setRuleEngineSetting(key, value) {
        if (!this.config.ruleEngine) this.config.ruleEngine = {};
        this.config.ruleEngine[key] = value;
        this.saveConfig();
        return value;
    }

    // Advanced Settings
    getAdvancedSetting(key, defaultValue = null) {
        return this.config.advanced?.[key] ?? defaultValue;
    }

    setAdvancedSetting(key, value) {
        if (!this.config.advanced) this.config.advanced = {};
        this.config.advanced[key] = value;
        this.saveConfig();
        return value;
    }

    // Export full configuration
    exportConfiguration() {
        return {
            ...this.config,
            exportedAt: new Date().toISOString(),
            exportedBy: 'OneComme OSC Router v' + this.configVersion
        };
    }

    // Import configuration with validation
    importConfiguration(importedConfig) {
        try {
            // Validate imported config structure
            if (!importedConfig || typeof importedConfig !== 'object') {
                throw new Error('Invalid configuration format');
            }

            // Merge imported config with current config
            const mergedConfig = this.deepMerge(this.config, importedConfig);
            
            // Update version and timestamp
            mergedConfig.version = this.configVersion;
            mergedConfig.lastUpdated = new Date().toISOString();

            this.config = mergedConfig;
            this.saveConfig();
            
            console.info('📥 Configuration imported successfully');
            return { success: true, message: 'Configuration imported successfully' };
            
        } catch (error) {
            console.error('❌ Failed to import configuration:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Reset to defaults
    resetToDefaults() {
        try {
            const backupPath = this.configPath.replace('.json', '.before-reset.json');
            if (fs.existsSync(this.configPath)) {
                fs.copyFileSync(this.configPath, backupPath);
                console.info(`📄 Current config backed up to ${backupPath}`);
            }
            
            this.config = this.getDefaultConfig();
            this.saveConfig();
            
            console.info('🔄 Configuration reset to defaults');
            return { success: true, message: 'Configuration reset to defaults' };
            
        } catch (error) {
            console.error('❌ Failed to reset configuration:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Get configuration summary for display
    getConfigurationSummary() {
        return {
            version: this.config.version,
            lastUpdated: this.config.lastUpdated,
            oscTarget: `${this.config.oscHost}:${this.config.oscPort}`,
            defaultEndpoints: this.config.enableDefaultEndpoints,
            webUIPort: this.config.webUI?.port || webUIPort,
            totalSettings: this.countTotalSettings()
        };
    }

    countTotalSettings() {
        let count = 0;
        const countObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    countObject(obj[key]);
                } else {
                    count++;
                }
            }
        };
        countObject(this.config);
        return count;
    }

    // Emoji removal utility
    removeEmojisFromText(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        // Remove HTML img tags that contain emoji data
        // This handles YouTube custom emojis like the example provided
        let cleanedText = text.replace(/<img[^>]*data-custom-emoji="true"[^>]*\/?>|<img[^>]*alt=":[^:]*:"[^>]*\/?>/gi, '');
        
        // Remove any remaining HTML img tags that might be emojis
        cleanedText = cleanedText.replace(/<img[^>]*\/?>|<img[^>]*>[^<]*<\/img>/gi, '');
        
        // Remove Unicode emojis (comprehensive emoji ranges)
        // This covers most common emojis including:
        // - Emoticons: 😀-😿
        // - Dingbats: ✂-➰
        // - Transport and Map: 🚀-🗿
        // - Additional symbols: 🤐-🧿
        // - Combining characters and modifiers
        cleanedText = cleanedText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '');
        
        // Remove additional emoji ranges and variation selectors
        cleanedText = cleanedText.replace(/[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{E0020}-\u{E007F}]/gu, '');
        
        // Clean up any extra whitespace that might be left
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
        
        return cleanedText;
    }

    // Get emoji removal setting
    getRemoveEmojis() {
        return this.getMessageProcessingSetting('removeEmojis', false);
    }

    // Set emoji removal setting
    setRemoveEmojis(enabled) {
        const result = this.setMessageProcessingSetting('removeEmojis', !!enabled);
        console.info(`🔄 Emoji removal ${enabled ? 'enabled' : 'disabled'}`);
        return result;
    }
}

// Rule engine for conditional routing with enhanced source-specific support
class RuleEngine {
    constructor() {
        this.rules = [];
        this.loadRules();
    }

    loadRules() {
        try {
            const rulesPath = path.join(__dirname, 'routing-rules.json');
            if (fs.existsSync(rulesPath)) {
                const data = fs.readFileSync(rulesPath, 'utf8');
                this.rules = JSON.parse(data);
                console.info(`Loaded ${this.rules.length} routing rules`);
            }
        } catch (error) {
            console.warn('Failed to load routing rules:', error.message);
            this.rules = [];
        }
    }

    saveRules() {
        try {
            const rulesPath = path.join(__dirname, 'routing-rules.json');
            fs.writeFileSync(rulesPath, JSON.stringify(this.rules, null, 2));
            console.info(`Saved ${this.rules.length} routing rules`);
        } catch (error) {
            console.error('Failed to save routing rules:', error.message);
        }
    }

    addRule(rule) {
        rule.id = rule.id || Date.now().toString();
        rule.enabled = rule.enabled !== false;
        this.rules.push(rule);
        this.saveRules();
        return rule;
    }

    updateRule(id, updatedRule) {
        const index = this.rules.findIndex(r => r.id === id);
        if (index !== -1) {
            this.rules[index] = { ...this.rules[index], ...updatedRule };
            this.saveRules();
            return this.rules[index];
        }
        return null;
    }

    deleteRule(id) {
        const index = this.rules.findIndex(r => r.id === id);
        if (index !== -1) {
            const deleted = this.rules.splice(index, 1)[0];
            this.saveRules();
            return deleted;
        }
        return null;
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

    processMessage(message) {
        const matchedRules = [];
        const actions = [];

        for (const rule of this.rules) {
            if (this.evaluateRule(rule, message)) {
                matchedRules.push(rule);
                if (rule.actions) {
                    actions.push(...rule.actions);
                }
            }
        }

        return {
            matchedRules,
            actions,
            shouldProcess: matchedRules.length === 0 || matchedRules.some(rule => !rule.blockDefault)
        };
    }

    filterMessageFields(message, fieldConfig) {
        if (!fieldConfig || fieldConfig.length === 0) {
            return message; // Return full message if no filtering specified
        }

        const filtered = {};
        for (const field of fieldConfig) {
            if (field.enabled) {
                const value = this.getFieldValue(message, field.path);
                if (value !== undefined) {
                    // Handle nested field paths
                    const parts = field.path.split('.');
                    let current = filtered;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]]) {
                            current[parts[i]] = {};
                        }
                        current = current[parts[i]];
                    }
                    current[parts[parts.length - 1]] = value;
                }
            }
        }

        return filtered;
    }
}

// Enhanced message converter with routing capabilities
class EnhancedMessageConverter {
    constructor() {
        this.ruleEngine = new RuleEngine();
    }

    convert(comment) {
        let service = comment.service;
        let data = comment.data;
        
        if (service == "youtube" && this.isYouTubeComment(data)) {
            const asSuper = this.toYouTubeSuper(data);
            return asSuper ? asSuper : new YouTubeComment(data);
        }
        if (service == "niconama" && this.isNiconamaComment(data)) {
            return data.hasGift
                ? new NiconamaGift(data)
                : new NiconamaComment(data);
        }
        if (service == "bilibili" && this.isBilibiliComment(data)) {
            return data.hasGift
                ? new BilibiliGift(data)
                : new BilibiliComment(data);
        }
        if (service == "twitch" && this.isTwitchMessage(data)) {
            return this.convertTwitchMessage(data);
        }
        return undefined;
    }

    toYouTubeSuper(raw) {
        if (!raw.hasGift) return undefined;
        return YouTubeSuperChat.fromOneSdk(raw);
    }

    isYouTubeComment(subject) {
        return subject !== undefined;
    }

    isNiconamaComment(subject) {
        return subject !== undefined;
    }

    isBilibiliComment(subject) {
        return subject !== undefined;
    }
    
    isTwitchMessage(subject) {
        return subject !== undefined;
    }
    
    convertTwitchMessage(data) {
        // Determine Twitch message type based on data properties
        if (data.subscriptionType || data.tier || data.isGift) {
            return new TwitchSubscription(data);
        }
        if (data.bits || data.bitsAmount || data.cheerEmotes) {
            return new TwitchBits(data);
        }
        if (data.viewerCount !== undefined || data.raiderName || data.raidType) {
            return new TwitchRaid(data);
        }
        // Default to regular comment
        return new TwitchComment(data);
    }
}

// Web UI server
class WebUIServer {
    constructor(ruleEngine, configManager, messageLogger) {
        this.ruleEngine = ruleEngine;
        this.configManager = configManager;
        this.messageLogger = messageLogger;
        this.app = express();
        this.server = null;
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'web-ui')));
        
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
    }

    setupRoutes() {
        // API Routes
        this.app.get('/api/rules', (req, res) => {
            res.json({ rules: this.ruleEngine.rules });
        });

        this.app.post('/api/rules', (req, res) => {
            try {
                const rule = this.ruleEngine.addRule(req.body);
                res.json({ success: true, rule });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        this.app.put('/api/rules/:id', (req, res) => {
            try {
                const rule = this.ruleEngine.updateRule(req.params.id, req.body);
                if (rule) {
                    res.json({ success: true, rule });
                } else {
                    res.status(404).json({ success: false, error: 'Rule not found' });
                }
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        this.app.delete('/api/rules/:id', (req, res) => {
            try {
                const rule = this.ruleEngine.deleteRule(req.params.id);
                if (rule) {
                    res.json({ success: true, rule });
                } else {
                    res.status(404).json({ success: false, error: 'Rule not found' });
                }
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Rule templates
        this.app.get('/api/templates', (req, res) => {
            const templates = this.getDefaultTemplates();
            res.json({ templates });
        });

        // Test rule endpoint
        this.app.post('/api/rules/test', (req, res) => {
            try {
                const { rule, testMessage } = req.body;
                const result = this.ruleEngine.evaluateRule(rule, testMessage);
                res.json({ success: true, matches: result });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Configuration endpoints
        this.app.get('/api/config', (req, res) => {
            res.json({ 
                success: true, 
                config: {
                    oscPort: this.configManager.getOscPort(),
                    oscHost: this.configManager.getOscHost(),
                    oscMessageFormat: this.configManager.getOscMessageFormat(),
                    enableDefaultEndpoints: this.configManager.getEnableDefaultEndpoints(),
                    removeEmojis: this.configManager.getRemoveEmojis()
                }
            });
        });

        this.app.put('/api/config', (req, res) => {
            try {
                const { oscPort, oscHost, oscMessageFormat, enableDefaultEndpoints, removeEmojis } = req.body;
                const updatedConfig = {};
                
                if (oscPort !== undefined) {
                    updatedConfig.oscPort = this.configManager.updateOscPort(oscPort);
                }
                
                if (oscHost !== undefined) {
                    updatedConfig.oscHost = this.configManager.updateOscHost(oscHost);
                }
                
                if (oscMessageFormat !== undefined) {
                    updatedConfig.oscMessageFormat = this.configManager.updateOscMessageFormat(oscMessageFormat);
                }
                
                if (enableDefaultEndpoints !== undefined) {
                    updatedConfig.enableDefaultEndpoints = this.configManager.setEnableDefaultEndpoints(enableDefaultEndpoints);
                }
                
                if (removeEmojis !== undefined) {
                    updatedConfig.removeEmojis = this.configManager.setRemoveEmojis(removeEmojis);
                }
                
                res.json({ 
                    success: true, 
                    message: 'Configuration updated successfully',
                    config: {
                        oscPort: this.configManager.getOscPort(),
                        oscHost: this.configManager.getOscHost(),
                        oscMessageFormat: this.configManager.getOscMessageFormat(),
                        enableDefaultEndpoints: this.configManager.getEnableDefaultEndpoints(),
                        removeEmojis: this.configManager.getRemoveEmojis()
                    },
                    note: removeEmojis !== undefined ? 'Emoji removal setting updated' : (enableDefaultEndpoints !== undefined ? 'Default endpoints setting updated' : (oscMessageFormat !== undefined ? 'OSC message format updated' : 'OSC client will be reconnected on next message'))
                });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // OSC Test endpoint
        this.app.post('/api/osc/test', (req, res) => {
            try {
                const { oscPort, oscHost } = req.body;
                const testHost = oscHost || this.configManager.getOscHost();
                const testPort = parseInt(oscPort) || this.configManager.getOscPort();
                
                // Validate port range
                if (testPort < 1024 || testPort > 65535) {
                    return res.status(400).json({
                        success: false,
                        error: 'OSC Port must be between 1024 and 65535'
                    });
                }
                
                // Send test OSC message
                this.sendTestOscMessage(testHost, testPort);
                
                res.json({
                    success: true,
                    message: `Test OSC message sent to ${testHost}:${testPort}`,
                    target: `${testHost}:${testPort}`,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(400).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        // Enhanced configuration API endpoints
        this.app.get('/api/config/full', (req, res) => {
            res.json({
                success: true,
                config: this.configManager.config,
                summary: this.configManager.getConfigurationSummary()
            });
        });

        // UI Preferences endpoints
        this.app.get('/api/config/ui', (req, res) => {
            res.json({
                success: true,
                ui: this.configManager.config.ui || {}
            });
        });

        this.app.put('/api/config/ui', (req, res) => {
            try {
                const updates = req.body;
                const updatedPreferences = {};
                
                for (const [key, value] of Object.entries(updates)) {
                    updatedPreferences[key] = this.configManager.setUIPreference(key, value);
                }
                
                res.json({
                    success: true,
                    message: 'UI preferences updated',
                    ui: updatedPreferences
                });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Configuration export/import endpoints
        this.app.get('/api/config/export', (req, res) => {
            try {
                const exportData = {
                    configuration: this.configManager.exportConfiguration(),
                    rules: this.ruleEngine.rules,
                    exportInfo: {
                        timestamp: new Date().toISOString(),
                        version: '2.0.0',
                        source: 'OneComme OSC Router'
                    }
                };
                
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="onecomme-config-${Date.now()}.json"`);
                res.json(exportData);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/config/import', (req, res) => {
            try {
                const { configuration, rules } = req.body;
                const results = [];
                
                // Import configuration if provided
                if (configuration) {
                    const configResult = this.configManager.importConfiguration(configuration);
                    results.push({ type: 'configuration', ...configResult });
                }
                
                // Import rules if provided
                if (rules && Array.isArray(rules)) {
                    try {
                        this.ruleEngine.rules = rules;
                        this.ruleEngine.saveRules();
                        results.push({ type: 'rules', success: true, message: `Imported ${rules.length} rules` });
                    } catch (error) {
                        results.push({ type: 'rules', success: false, error: error.message });
                    }
                }
                
                const allSuccessful = results.every(r => r.success);
                
                res.json({
                    success: allSuccessful,
                    message: allSuccessful ? 'Configuration imported successfully' : 'Partial import completed',
                    results: results
                });
                
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Configuration reset endpoint
        this.app.post('/api/config/reset', (req, res) => {
            try {
                const result = this.configManager.resetToDefaults();
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Advanced settings endpoints
        this.app.get('/api/config/advanced', (req, res) => {
            res.json({
                success: true,
                advanced: this.configManager.config.advanced || {}
            });
        });

        this.app.put('/api/config/advanced', (req, res) => {
            try {
                const updates = req.body;
                const updatedSettings = {};
                
                for (const [key, value] of Object.entries(updates)) {
                    updatedSettings[key] = this.configManager.setAdvancedSetting(key, value);
                }
                
                res.json({
                    success: true,
                    message: 'Advanced settings updated',
                    advanced: updatedSettings
                });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Message logging endpoints
        this.app.get('/api/logs', (req, res) => {
            const limit = parseInt(req.query.limit) || null;
            const messages = this.messageLogger.getMessages(limit);
            res.json({ 
                success: true, 
                messages: messages,
                total: messages.length
            });
        });

        this.app.delete('/api/logs', (req, res) => {
            this.messageLogger.clearMessages();
            res.json({ 
                success: true, 
                message: 'Message logs cleared'
            });
        });

        // Serve main UI
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'web-ui', 'index.html'));
        });
    }

    getDefaultTemplates() {
        return [
            {
                name: "High Value Gifts Only",
                description: "Route gifts worth more than $10 to a special endpoint",
                rule: {
                    name: "High Value Gifts",
                    conditions: [
                        {
                            field: "price",
                            operator: "greater_than",
                            value: 10,
                            dataType: "number"
                        },
                        {
                            field: "hasGift",
                            operator: "equals",
                            value: true,
                            dataType: "boolean"
                        }
                    ],
                    conditionLogic: "AND",
                    actions: [
                        {
                            type: "route_to_endpoint",
                            endpoint: "/onecomme/high-value-gifts",
                            fields: ["name", "comment", "price", "giftName"]
                        }
                    ],
                    enabled: true,
                    blockDefault: false
                }
            },
            {
                name: "Bilibili Only",
                description: "Route only Bilibili messages to a custom endpoint",
                rule: {
                    name: "Bilibili Messages",
                    conditions: [
                        {
                            field: "type",
                            operator: "contains",
                            value: "bilibili",
                            dataType: "string"
                        }
                    ],
                    conditionLogic: "AND",
                    actions: [
                        {
                            type: "route_to_endpoint",
                            endpoint: "/onecomme/bilibili-only",
                            fields: ["name", "comment", "userLevel", "guardLevel"]
                        }
                    ],
                    enabled: true,
                    blockDefault: true
                }
            },
            {
                name: "VIP Users Only",
                description: "Route messages from VIP/SVIP users to special endpoint",
                rule: {
                    name: "VIP Users",
                    conditions: [
                        {
                            field: "isVip",
                            operator: "equals",
                            value: true,
                            dataType: "boolean"
                        }
                    ],
                    conditionLogic: "OR",
                    actions: [
                        {
                            type: "route_to_endpoint",
                            endpoint: "/onecomme/vip-messages",
                            fields: ["name", "comment", "isVip", "isSvip"]
                        }
                    ],
                    enabled: true,
                    blockDefault: false
                }
            }
        ];
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(webUIPort, () => {
                console.info(`OneComme OSC Router Configuration UI running on http://localhost:${webUIPort}`);
                resolve();
            });

            this.server.on('error', reject);
        });
    }

    sendTestOscMessage(host, port) {
        try {
            // Create a temporary OSC client for testing
            const testClient = new Client(host, port);
            
            // Create test message with current timestamp
            const testData = {
                type: 'connection-test',
                message: 'OneComme OSC Router Connection Test',
                timestamp: new Date().toISOString(),
                host: host,
                port: port,
                plugin: 'onecomme-osc-router',
                version: '2.0.0',
                author: 'noodledostuff'
            };
            
            const jsonData = JSON.stringify(testData);
            const utf8Data = Buffer.from(jsonData, "utf-8");
            
            // Send test messages to common endpoints
            const testEndpoints = [
                '/onecomme/test',
                '/onecomme/connection-test',
                '/test/osc-router'
            ];
            
            testEndpoints.forEach(endpoint => {
                const message = new Message(endpoint, utf8Data);
                testClient.send(message);
                console.info(`Test OSC message sent to ${host}:${port}${endpoint}`);
            });
            
            // Send a simple string test message
            const simpleMessage = new Message('/onecomme/test/ping', 'OneComme OSC Router Test - Connection OK');
            testClient.send(simpleMessage);
            console.info(`Simple test message sent to ${host}:${port}/onecomme/test/ping`);
            
            // Close the test client after a brief delay
            setTimeout(() => {
                testClient.close();
            }, 100);
            
        } catch (error) {
            console.error('Failed to send test OSC message:', error.message);
            throw error;
        }
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}

// Enhanced main domain class
class Domain {
    constructor() {
        this.uid = "onecomme-osc-router";
        this.name = "OneComme OSC Router";
        this.version = "2.0.0";
        this.author = "noodledostuff";
        this.url = "http://127.0.0.1:19101";
        this.permissions = ["comments"];
        this.defaultState = {};
        
        // Enhanced components
        this.configManager = new ConfigManager();
        this.messageLogger = new MessageLogger(100);
        this.converter = new EnhancedMessageConverter();
        this.ruleEngine = this.converter.ruleEngine;
        this.webUI = new WebUIServer(this.ruleEngine, this.configManager, this.messageLogger);
        this.client = null;
    }

    async init(_api, _initialData) {
        console.info("OneComme OSC Router initializing...");
        
        this.initOscClient();
        
        try {
            await this.webUI.start();
            console.info("Configuration UI started successfully");
        } catch (error) {
            console.error("Failed to start configuration UI:", error.message);
        }
    }

    initOscClient() {
        try {
            // Close existing client safely
            if (this.client) {
                console.debug(`🔄 Closing existing OSC client`);
                try {
                    this.client.close();
                } catch (closeError) {
                    console.warn(`⚠️ Failed to close existing OSC client: ${closeError.message}`);
                }
                this.client = null;
            }
            
            const oscPort = this.configManager.getOscPort();
            const oscHost = this.configManager.getOscHost();
            
            console.debug(`🔄 Initializing OSC client to ${oscHost}:${oscPort}`);
            
            // Validate configuration
            if (!oscHost || oscHost.trim() === '') {
                throw new Error('OSC host cannot be empty');
            }
            
            if (!oscPort || oscPort < 1024 || oscPort > 65535) {
                throw new Error(`Invalid OSC port: ${oscPort}. Must be between 1024-65535`);
            }
            
            // Create new client
            this.client = new Client(oscHost, oscPort);
            
            // Set up error handling for the client
            if (this.client && typeof this.client.on === 'function') {
                this.client.on('error', (error) => {
                    console.error(`❌ OSC Client Error: ${error.message}`);
                });
            }
            
            this.lastConnectedPort = oscPort;
            this.lastConnectedHost = oscHost;
            
            console.info(`✅ OSC Client connected to ${oscHost}:${oscPort}`);
            
        } catch (error) {
            console.error(`❌ Failed to initialize OSC client: ${error.message}`);
            this.client = null;
            throw error;
        }
    }

    destroy() {
        console.info("OneComme OSC Router disposing...");
        
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        
        if (this.webUI) {
            this.webUI.stop();
        }
    }

    subscribe(type, ...args) {
        console.info(`OneComme OSC subscription notified. Type: ${type}`);
        if (type != "comments") return;
        
        args.forEach(x => {
            if (!x.comments) return;
            this.processComments(x.comments);
        });
    }

    processComments(comments) {
        console.info(`📝 Processing ${comments.length} comment(s)`);
        
        comments.forEach((cm, index) => {
            const messageId = `msg-${Date.now()}-${index}`;
            console.debug(`🔄 [${messageId}] Processing comment from ${cm.service}`);
            
            try {
                // Log incoming message
                this.messageLogger.logIncoming(cm.service, cm.data, true);
                console.debug(`📝 [${messageId}] Logged incoming message`);
                
                // Apply emoji removal if enabled
                if (this.configManager.getRemoveEmojis() && cm.data && cm.data.comment) {
                    const originalComment = cm.data.comment;
                    cm.data.comment = this.configManager.removeEmojisFromText(originalComment);
                    
                    // Log emoji removal activity
                    if (originalComment !== cm.data.comment) {
                        console.debug(`🎭 [${messageId}] Emojis removed from comment`);
                        console.debug(`   Original: ${originalComment.substring(0, 100)}${originalComment.length > 100 ? '...' : ''}`);
                        console.debug(`   Cleaned:  ${cm.data.comment.substring(0, 100)}${cm.data.comment.length > 100 ? '...' : ''}`);
                    }
                }
                
                const subject = this.converter.convert(cm);
                if (subject === undefined) {
                    console.warn(`⚠️ [${messageId}] Message conversion failed - no subject created`);
                    this.messageLogger.logIncoming(cm.service, cm.data, false);
                    return;
                }
                console.debug(`✅ [${messageId}] Message converted to subject: ${subject.constructor.name}`);
                console.debug(`🎯 [${messageId}] Target endpoint: ${subject.endpoint}`);

                // Apply routing rules
                const ruleResult = this.ruleEngine.processMessage(subject);
                console.info(`📋 [${messageId}] Message matched ${ruleResult.matchedRules.length} rules, ${ruleResult.actions.length} actions`);
                console.debug(`📝 [${messageId}] Should process default endpoints: ${ruleResult.shouldProcess}`);
                
                if (ruleResult.matchedRules.length > 0) {
                    console.debug(`📋 [${messageId}] Matched rules: ${ruleResult.matchedRules.map(r => r.name || r.id).join(', ')}`);
                }

                // Process custom actions from rules
                for (const action of ruleResult.actions) {
                    try {
                        console.debug(`⚙️ [${messageId}] Processing custom action: ${action.type} -> ${action.endpoint}`);
                        this.processCustomAction(action, subject);
                        console.debug(`✅ [${messageId}] Custom action completed`);
                    } catch (actionError) {
                        console.error(`❌ [${messageId}] Failed to process custom action: ${actionError.message}`);
                    }
                }

                // Send to default endpoints if not blocked and default endpoints are enabled
                const defaultEndpointsEnabled = this.configManager.getEnableDefaultEndpoints();
                console.debug(`🎯 [${messageId}] Default endpoints enabled: ${defaultEndpointsEnabled}, should process: ${ruleResult.shouldProcess}`);
                
                if (ruleResult.shouldProcess && defaultEndpointsEnabled) {
                    console.debug(`📤 [${messageId}] Sending to default endpoints`);
                    this.sendToDefaultEndpoints(subject);
                } else {
                    const reason = !ruleResult.shouldProcess ? 'blocked by rules' : 'default endpoints disabled';
                    console.debug(`⏸️ [${messageId}] Skipping default endpoints: ${reason}`);
                }
                
                console.debug(`✅ [${messageId}] Message processing completed`);

            } catch (error) {
                console.error(`❌ [${messageId}] Failed to process comment from ${cm.service}: ${error.message}`);
                console.error(`[${messageId}] Error stack:`, error.stack);
                this.messageLogger.logIncoming(cm.service, cm.data, false);
            }
        });
    }

    processCustomAction(action, message) {
        if (action.type === 'route_to_endpoint') {
            const filteredMessage = this.ruleEngine.filterMessageFields(message, 
                action.fields ? action.fields.map(f => ({ path: f, enabled: true })) : null);
            
            const jsonData = JSON.stringify(filteredMessage);
            const utf8Data = Buffer.from(jsonData, "utf-8");
            
            this.send(action.endpoint, utf8Data);
            console.info(`Sent custom routed message to ${action.endpoint}`);
        }
    }

    sendToDefaultEndpoints(subject) {
        console.debug(`🎯 Sending to default endpoint: ${subject.endpoint}`);
        
        // Send OSC message for specific endpoint
        try {
            if (!subject.endpoint) {
                throw new Error('Subject has no endpoint defined');
            }
            
            console.debug(`🔄 Getting JSON from subject: ${subject.constructor.name}`);
            const json = subject.getJson();
            
            if (!json) {
                throw new Error('Subject.getJson() returned null/undefined');
            }
            
            console.debug(`📦 JSON length: ${json.length} characters`);
            const jsonUtf8 = Buffer.from(json, "utf-8");
            
            console.debug(`📤 Calling send method for ${subject.endpoint}`);
            this.send(subject.endpoint, jsonUtf8);
            
            console.debug(`✅ Default endpoint send completed for ${subject.endpoint}`);
        } catch (oscError) {
            console.error(`❌ Failed to send OSC message to default endpoint ${subject.endpoint}: ${oscError.message}`);
            console.error('OSC Error stack:', oscError.stack);
        }
    }

    send(oscEndpoint, data) {
        try {
            // Ensure we have the latest OSC client configuration
            if (!this.client || this.shouldReconnectClient()) {
                console.debug(`🔄 Reconnecting OSC client (client exists: ${!!this.client}, should reconnect: ${this.shouldReconnectClient()})`);
                this.initOscClient();
            }
            
            const oscPort = this.configManager.getOscPort();
            const oscHost = this.configManager.getOscHost();
            
            if (!this.client) {
                const error = new Error('OSC client failed to initialize');
                console.error(`❌ OSC Client Error: ${error.message}`);
                this.messageLogger.logOutgoing(oscEndpoint, data.toString(), false, error.message);
                throw error;
            }
            
            // Validate OSC endpoint
            if (!oscEndpoint || !oscEndpoint.startsWith('/')) {
                const error = new Error(`Invalid OSC endpoint: ${oscEndpoint}`);
                console.error(`❌ Invalid Endpoint: ${error.message}`);
                this.messageLogger.logOutgoing(oscEndpoint, data.toString(), false, error.message);
                throw error;
            }
            
            // Validate data
            if (!data) {
                const error = new Error('No data provided for OSC message');
                console.error(`❌ No Data: ${error.message}`);
                this.messageLogger.logOutgoing(oscEndpoint, 'null', false, error.message);
                throw error;
            }
            
            // Determine OSC message format
            const oscMessageFormat = this.configManager.getOscMessageFormat();
            let oscData;
            
            if (oscMessageFormat === 'string') {
                // Send as string - convert buffer to string if needed
                oscData = data.toString('utf-8');
                console.info(`📤 Sending OSC String: ${oscHost}:${oscPort}${oscEndpoint} [${oscData.length} chars]`);
            } else {
                // Send as binary blob (default)
                oscData = data;
                console.info(`📤 Sending OSC Binary: ${oscHost}:${oscPort}${oscEndpoint} [${data.length} bytes]`);
            }
            
            const messagePreview = oscData.toString().substring(0, 200);
            console.debug(`📦 Data preview (${oscMessageFormat}): ${messagePreview}${oscData.toString().length > 200 ? '...' : ''}`);
            
            // Create OSC message with error handling
            let message;
            try {
                message = new Message(oscEndpoint, oscData);
                console.debug(`✅ OSC Message created successfully (format: ${oscMessageFormat})`);
            } catch (messageError) {
                const error = new Error(`Failed to create OSC message: ${messageError.message}`);
                console.error(`❌ Message Creation Error: ${error.message}`);
                this.messageLogger.logOutgoing(oscEndpoint, oscData.toString(), false, error.message);
                throw error;
            }
            
            // Send message with proper error handling
            try {
                this.client.send(message);
                console.debug(`✅ OSC message sent successfully to ${oscEndpoint}`);
                this.messageLogger.logOutgoing(oscEndpoint, oscData.toString(), true);
            } catch (sendError) {
                console.error(`❌ OSC Send Error: ${sendError.message}`);
                this.messageLogger.logOutgoing(oscEndpoint, oscData.toString(), false, sendError.message);
                
                // Try to recover by reinitializing the client
                console.warn(`🔄 Attempting to recover OSC client connection...`);
                this.initOscClient();
                
                // Rethrow to trigger the outer catch block
                throw sendError;
            }
            
        } catch (error) {
            console.error(`❌ Critical OSC Error: ${error.message}`);
            console.error(`Stack trace:`, error.stack);
            
            // Log failed outgoing message  
            const logData = oscData ? oscData.toString() : (data ? data.toString() : 'null');
            this.messageLogger.logOutgoing(oscEndpoint, logData, false, error.message);
            
            // Don't throw here to prevent stopping the entire message processing
            // The error is already logged for debugging
        }
    }
    
    shouldReconnectClient() {
        if (!this.client) return true;
        
        // Check if configuration has changed since last connection
        const currentPort = this.configManager.getOscPort();
        const currentHost = this.configManager.getOscHost();
        
        return this.lastConnectedPort !== currentPort || this.lastConnectedHost !== currentHost;
    }
}

module.exports = new Domain();
