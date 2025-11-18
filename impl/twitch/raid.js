"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchRaid = void 0;
const common_1 = require("./common");

const twitchRaidApi = "/onecomme/twitch/raid";

class TwitchRaid extends common_1.TwitchCommon {
    constructor(raw) {
        super(raw);
        this.type = "twitch-raid";
        this.endpoint = twitchRaidApi;
        this.hasGift = true; // Raids are considered "gifts" (bringing viewers)
        
        // Raid specific properties
        this.raiderName = raw.raiderName || raw.fromChannel || this.name;
        this.raiderDisplayName = raw.raiderDisplayName || raw.fromDisplayName || this.displayName;
        this.raiderId = raw.raiderId || raw.fromChannelId || this.userId;
        this.viewerCount = raw.viewerCount || raw.raiderCount || 0;
        
        // Target channel (being raided)
        this.targetChannelName = raw.targetChannelName || raw.toChannel || "";
        this.targetChannelId = raw.targetChannelId || raw.toChannelId || "";
        this.targetDisplayName = raw.targetDisplayName || raw.toDisplayName || "";
        
        // Raid message
        this.raidMessage = raw.raidMessage || raw.message || "";
        
        // Override properties for raid context
        this.name = this.raiderName;
        this.displayName = this.raiderDisplayName;
        this.userId = this.raiderId;
        this.comment = `Raided with ${this.viewerCount} viewers! ${this.raidMessage}`.trim();
        
        // Raid metadata
        this.isHosting = raw.isHosting || false; // Legacy hosting vs raid
        this.raidType = raw.raidType || "raid"; // "raid" or "host"
    }

    getJson() {
        return JSON.stringify(this);
    }
    
    asPost() {
        const base = super.asPost();
        
        const obj = Object.assign(Object.assign({}, base), {
            raiderName: this.raiderName,
            raiderDisplayName: this.raiderDisplayName,
            raiderId: this.raiderId,
            viewerCount: this.viewerCount,
            targetChannelName: this.targetChannelName,
            targetChannelId: this.targetChannelId,
            targetDisplayName: this.targetDisplayName,
            raidMessage: this.raidMessage,
            isHosting: this.isHosting,
            raidType: this.raidType
        });
        
        return obj;
    }

    static fromOneSdk(raw) {
        return new TwitchRaid(raw);
    }
    
    // Helper method to determine if this is a "big" raid
    isBigRaid(threshold = 50) {
        return this.viewerCount >= threshold;
    }
    
    // Helper method to get raid size category
    getRaidSize() {
        if (this.viewerCount >= 1000) return "massive";
        if (this.viewerCount >= 500) return "huge";
        if (this.viewerCount >= 100) return "large";
        if (this.viewerCount >= 50) return "medium";
        if (this.viewerCount >= 10) return "small";
        return "tiny";
    }
}
exports.TwitchRaid = TwitchRaid;