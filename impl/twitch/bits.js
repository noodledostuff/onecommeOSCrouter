"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchBits = void 0;
const common_1 = require("./common");

const twitchBitsApi = "/onecomme/twitch/bits";

class TwitchBits extends common_1.TwitchCommon {
    constructor(raw) {
        super(raw);
        this.type = "twitch-bits";
        this.endpoint = twitchBitsApi;
        this.hasGift = true; // Bits are considered "gifts"
        
        // Bits specific properties
        this.bits = raw.bits || raw.bitsAmount || 0;
        this.totalBits = raw.totalBits || this.bits; // Total bits from this user
        this.bitsInDollars = raw.bitsInDollars || this.calculateDollarValue(this.bits);
        
        // Cheer badge information
        this.cheerBadge = raw.cheerBadge || null;
        this.cheerBadgeTier = raw.cheerBadgeTier || 0;
        
        // Anonymous cheering
        this.isAnonymous = raw.isAnonymous || false;
        
        // Cheer emotes used in the message
        this.cheerEmotes = raw.cheerEmotes || [];
        
        // Message with cheer emotes
        this.bitsMessage = raw.bitsMessage || raw.message || this.comment;
        
        // Override comment for bits message
        this.comment = this.bitsMessage || "";
        
        // Pinned cheer
        this.isPinned = raw.isPinned || false;
    }

    getJson() {
        return JSON.stringify(this);
    }
    
    asPost() {
        const base = super.asPost();
        
        const obj = Object.assign(Object.assign({}, base), {
            bits: this.bits,
            totalBits: this.totalBits,
            bitsInDollars: this.bitsInDollars,
            cheerBadge: this.cheerBadge,
            cheerBadgeTier: this.cheerBadgeTier,
            isAnonymous: this.isAnonymous,
            cheerEmotes: this.cheerEmotes,
            bitsMessage: this.bitsMessage,
            isPinned: this.isPinned
        });
        
        return obj;
    }

    static fromOneSdk(raw) {
        return new TwitchBits(raw);
    }
    
    // Helper method to calculate approximate dollar value
    // Bits are roughly $0.014 per bit for streamers (Twitch takes a cut)
    calculateDollarValue(bits) {
        return Math.round(bits * 0.014 * 100) / 100; // Round to 2 decimal places
    }
    
    // Helper method to get the cheer tier based on bits amount
    getCheerTier() {
        if (this.bits >= 10000) return "10000+";
        if (this.bits >= 5000) return "5000+";
        if (this.bits >= 1000) return "1000+";
        if (this.bits >= 500) return "500+";
        if (this.bits >= 100) return "100+";
        if (this.bits >= 10) return "10+";
        return "1+";
    }
    
    // Helper method to determine if this is a "big" cheer
    isBigCheer(threshold = 1000) {
        return this.bits >= threshold;
    }
}
exports.TwitchBits = TwitchBits;