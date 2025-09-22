"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchSubscription = void 0;
const common_1 = require("./common");

const twitchSubscriptionApi = "/onecomme/twitch/subscription";

class TwitchSubscription extends common_1.TwitchCommon {
    constructor(raw) {
        super(raw);
        this.type = "twitch-subscription";
        this.endpoint = twitchSubscriptionApi;
        this.hasGift = true; // Subscriptions are considered "gifts"
        
        // Subscription specific properties
        this.subscriptionType = raw.subscriptionType || ""; // "sub", "resub", "gift_sub", "community_gift_sub"
        this.tier = raw.tier || raw.subscriptionTier || "1000"; // "1000", "2000", "3000"
        this.months = raw.months || raw.cumulativeMonths || 0;
        this.streak = raw.streak || raw.streakMonths || 0;
        this.isGift = raw.isGift || false;
        this.gifterId = raw.gifterId || "";
        this.gifterName = raw.gifterName || "";
        this.gifterDisplayName = raw.gifterDisplayName || "";
        this.recipientId = raw.recipientId || "";
        this.recipientName = raw.recipientName || "";
        this.recipientDisplayName = raw.recipientDisplayName || "";
        this.multiMonthGift = raw.multiMonthGift || 1;
        this.multiMonthTenure = raw.multiMonthTenure || 0;
        
        // Community gift subs
        this.massGiftCount = raw.massGiftCount || 0;
        this.senderCount = raw.senderCount || 0; // Total gifts from this user
        
        // Prime subscription
        this.isPrime = raw.isPrime || false;
        
        // Subscription plan name
        this.plan = raw.plan || `Tier ${this.tier === "1000" ? "1" : this.tier === "2000" ? "2" : "3"}`;
        this.planName = raw.planName || this.plan;
        
        // Message from subscriber
        this.subMessage = raw.subMessage || raw.message || this.comment;
        
        // Override comment for subscription message
        this.comment = this.subMessage || "";
    }

    getJson() {
        return JSON.stringify(this);
    }
    
    asPost() {
        const base = super.asPost();
        
        const obj = Object.assign(Object.assign({}, base), {
            subscriptionType: this.subscriptionType,
            tier: this.tier,
            months: this.months,
            streak: this.streak,
            isGift: this.isGift,
            gifterId: this.gifterId,
            gifterName: this.gifterName,
            gifterDisplayName: this.gifterDisplayName,
            recipientId: this.recipientId,
            recipientName: this.recipientName,
            recipientDisplayName: this.recipientDisplayName,
            multiMonthGift: this.multiMonthGift,
            multiMonthTenure: this.multiMonthTenure,
            massGiftCount: this.massGiftCount,
            senderCount: this.senderCount,
            isPrime: this.isPrime,
            plan: this.plan,
            planName: this.planName,
            subMessage: this.subMessage
        });
        
        return obj;
    }

    static fromOneSdk(raw) {
        return new TwitchSubscription(raw);
    }
    
    // Helper method to get subscription tier as number
    getTierNumber() {
        switch (this.tier) {
            case "1000":
            case "Prime":
                return 1;
            case "2000":
                return 2;
            case "3000":
                return 3;
            default:
                return 1;
        }
    }
    
    // Helper method to get monetary value (approximate)
    getApproximateValue() {
        const tierValues = {
            "1000": 4.99,
            "2000": 9.99,
            "3000": 24.99,
            "Prime": 0 // Free with Prime
        };
        
        const baseValue = tierValues[this.tier] || tierValues["1000"];
        return baseValue * (this.multiMonthGift || 1);
    }
}
exports.TwitchSubscription = TwitchSubscription;