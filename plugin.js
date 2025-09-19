const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Client, Message } = require('node-osc');

// Import existing implementations
const { NiconamaComment, NiconamaGift } = require('./impl/niconico');
const { YouTubeComment, YouTubeSuperChat } = require('./impl/youtube/index');
const { BilibiliComment, BilibiliGift } = require('./impl/bilibili/index');

const endpoint = "127.0.0.1";
const defaultPort = 19100;
const webUIPort = 19101; // Web UI will run on this port
const defaultPostApi = "/onecomme/common";

// Configuration management
class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, 'config.json');
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                const config = JSON.parse(data);
                console.info(`Loaded configuration: OSC port ${config.oscPort}`);
                return config;
            }
        } catch (error) {
            console.warn('Failed to load configuration:', error.message);
        }
        
        // Return default configuration
        const defaultConfig = {
            oscPort: defaultPort,
            oscHost: endpoint
        };
        this.saveConfig(defaultConfig);
        return defaultConfig;
    }

    saveConfig(config = null) {
        try {
            const configToSave = config || this.config;
            fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
            console.info(`Saved configuration: OSC port ${configToSave.oscPort}`);
        } catch (error) {
            console.error('Failed to save configuration:', error.message);
        }
    }

    getOscPort() {
        return this.config.oscPort || defaultPort;
    }

    getOscHost() {
        return this.config.oscHost || endpoint;
    }

    updateOscPort(port) {
        this.config.oscPort = parseInt(port) || defaultPort;
        this.saveConfig();
        return this.config.oscPort;
    }

    updateOscHost(host) {
        this.config.oscHost = host || endpoint;
        this.saveConfig();
        return this.config.oscHost;
    }
}

// Rule engine for conditional routing
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

    evaluateRule(rule, message) {
        if (!rule.enabled) return false;

        const { conditions, conditionLogic } = rule;
        if (!conditions || conditions.length === 0) return true;

        const results = conditions.map(condition => this.evaluateCondition(condition, message));

        if (conditionLogic === 'OR') {
            return results.some(result => result);
        } else { // AND
            return results.every(result => result);
        }
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
}

// Web UI server
class WebUIServer {
    constructor(ruleEngine, configManager) {
        this.ruleEngine = ruleEngine;
        this.configManager = configManager;
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
                    oscHost: this.configManager.getOscHost()
                }
            });
        });

        this.app.put('/api/config', (req, res) => {
            try {
                const { oscPort, oscHost } = req.body;
                const updatedConfig = {};
                
                if (oscPort !== undefined) {
                    updatedConfig.oscPort = this.configManager.updateOscPort(oscPort);
                }
                
                if (oscHost !== undefined) {
                    updatedConfig.oscHost = this.configManager.updateOscHost(oscHost);
                }
                
                res.json({ 
                    success: true, 
                    message: 'Configuration updated successfully',
                    config: {
                        oscPort: this.configManager.getOscPort(),
                        oscHost: this.configManager.getOscHost()
                    },
                    note: 'OSC client will be reconnected on next message'
                });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
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
        this.url = "https://github.com/noodledostuff/onecommeOSCrouter";
        this.permissions = ["comments"];
        this.defaultState = {};
        
        // Enhanced components
        this.configManager = new ConfigManager();
        this.converter = new EnhancedMessageConverter();
        this.ruleEngine = this.converter.ruleEngine;
        this.webUI = new WebUIServer(this.ruleEngine, this.configManager);
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
        if (this.client) {
            this.client.close();
        }
        
        const oscPort = this.configManager.getOscPort();
        const oscHost = this.configManager.getOscHost();
        
        this.client = new Client(oscHost, oscPort);
        this.lastConnectedPort = oscPort;
        this.lastConnectedHost = oscHost;
        
        console.info(`OSC Client connected to ${oscHost}:${oscPort}`);
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
        comments.forEach((cm) => {
            try {
                const subject = this.converter.convert(cm);
                if (subject === undefined) return;

                // Apply routing rules
                const ruleResult = this.ruleEngine.processMessage(subject);
                console.info(`Message matched ${ruleResult.matchedRules.length} rules`);

                // Process custom actions from rules
                for (const action of ruleResult.actions) {
                    try {
                        this.processCustomAction(action, subject);
                    } catch (actionError) {
                        console.error(`Failed to process custom action: ${actionError.message}`);
                    }
                }

                // Send to default endpoints if not blocked
                if (ruleResult.shouldProcess) {
                    this.sendToDefaultEndpoints(subject);
                }

            } catch (error) {
                console.error(`Failed to process comment from ${cm.service}: ${error.message}`);
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
        // Send OSC message for specific endpoint
        try {
            const json = subject.getJson();
            const jsonUtf8 = Buffer.from(json, "utf-8");
            this.send(subject.endpoint, jsonUtf8);
        } catch (oscError) {
            console.error(`Failed to send OSC message: ${oscError.message}`);
        }
        
        // Send common API message
        try {
            const post = subject.asPost();
            if (post !== undefined) {
                const postJson = JSON.stringify(post);
                const postUtf8 = Buffer.from(postJson, "utf-8");
                this.send(defaultPostApi, postUtf8);
            }
        } catch (commonError) {
            console.error(`Failed to send common API message: ${commonError.message}`);
        }
    }

    send(oscEndpoint, data) {
        // Ensure we have the latest OSC client configuration
        if (!this.client || this.shouldReconnectClient()) {
            this.initOscClient();
        }
        
        const oscPort = this.configManager.getOscPort();
        const oscHost = this.configManager.getOscHost();
        
        console.info(`Sending message to ${oscHost}:${oscPort}${oscEndpoint}: ${data.toString().substring(0, 100)}...`);
        const message = new Message(oscEndpoint, data);
        if (this.client) {
            this.client.send(message);
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
