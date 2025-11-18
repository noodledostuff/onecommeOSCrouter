"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchCommon = void 0;
const types_1 = require("../types");
const comment_1 = require("../comment");

class TwitchCommon {
    constructor(raw) {
        this.id = raw.id || raw.msgId || "";
        this.liveId = raw.liveId || raw.channelId || "";
        this.userId = raw.userId || raw.user?.id || "";
        this.name = raw.name || raw.user?.login || raw.username || "";
        this.displayName = raw.displayName || raw.user?.displayName || this.name;
        this.isOwner = raw.isOwner || raw.isBroadcaster || false;
        this.isModerator = raw.isModerator || raw.isMod || false;
        this.timestamp = types_1.Timestamp.from(raw.timestamp || new Date().toISOString());
        this.hasGift = raw.hasGift || false;
        this.comment = (0, comment_1.normalizeEmoji)(raw.comment || raw.message || "");
        this.profileImageUrl = raw.profileImage || raw.user?.profileImageUrl || "";
        
        // Twitch specific properties
        this.isSubscriber = raw.isSubscriber || raw.isSubscribed || false;
        this.isVip = raw.isVip || false;
        this.isPartner = raw.isPartner || false;
        this.isAffiliate = raw.isAffiliate || false;
        this.isTurbo = raw.isTurbo || false;
        this.isPrime = raw.isPrime || false;
        this.isStaff = raw.isStaff || false;
        this.isGlobalMod = raw.isGlobalMod || false;
        
        // Badge information
        this.badges = raw.badges || [];
        this.badgeInfo = raw.badgeInfo || {};
        
        // Color and cosmetics
        this.color = raw.color || "#FFFFFF";
        this.emotes = raw.emotes || {};
        
        // User status
        this.userType = raw.userType || ""; // "", "mod", "global_mod", "admin", "staff"
        this.subscriptionTier = raw.subscriptionTier || 0; // 1000, 2000, 3000 for tier 1,2,3
        this.subscriptionMonths = raw.subscriptionMonths || 0;
        
        // Channel specific
        this.channelName = raw.channelName || raw.channel || "";
        this.roomId = raw.roomId || "";
        
        // Message metadata
        this.firstMsg = raw.firstMsg || false; // First time chatter
        this.returning = raw.returning || false; // Returning chatter
        this.rituals = raw.rituals || {}; // new_chatter ritual etc.
    }

    asPost() {
        return {
            type: this.type || "twitch",
            author: this.name || "",
            displayName: this.displayName || "",
            comment: this.comment || "",
            timestamp: this.timestamp,
            iconUrl: this.profileImageUrl || "",
            // Twitch specific fields
            isSubscriber: this.isSubscriber,
            isVip: this.isVip,
            isModerator: this.isModerator,
            isPartner: this.isPartner,
            isAffiliate: this.isAffiliate,
            isTurbo: this.isTurbo,
            isPrime: this.isPrime,
            isStaff: this.isStaff,
            isGlobalMod: this.isGlobalMod,
            badges: this.badges,
            badgeInfo: this.badgeInfo,
            color: this.color,
            emotes: this.emotes,
            userType: this.userType,
            subscriptionTier: this.subscriptionTier,
            subscriptionMonths: this.subscriptionMonths,
            channelName: this.channelName,
            firstMsg: this.firstMsg,
            returning: this.returning,
            rituals: this.rituals
        };
    }
}
exports.TwitchCommon = TwitchCommon;