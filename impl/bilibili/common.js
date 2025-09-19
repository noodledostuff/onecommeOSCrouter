"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliCommon = void 0;
const types_1 = require("../types");
const comment_1 = require("../comment");

class BilibiliCommon {
    constructor(raw) {
        this.id = raw.id;
        this.liveId = raw.liveId || raw.roomId;
        this.userId = raw.userId || raw.uid;
        this.name = raw.name || raw.uname;
        this.isOwner = raw.isOwner || false;
        this.timestamp = types_1.Timestamp.from(raw.timestamp);
        this.hasGift = raw.hasGift || false;
        this.comment = (0, comment_1.normalizeEmoji)(raw.comment || raw.msg || "");
        this.displayName = raw.displayName || raw.uname || raw.name;
        this.profileImageUrl = raw.profileImage || raw.face || "";
        
        // Bilibili specific properties
        this.userLevel = raw.userLevel || 0;
        this.medalLevel = raw.medalLevel || 0;
        this.medalName = raw.medalName || "";
        this.isVip = raw.isVip || false;
        this.isSvip = raw.isSvip || false;
        this.guardLevel = raw.guardLevel || 0; // 0=none, 1=总督, 2=提督, 3=舰长
        this.fansMedal = raw.fansMedal || null;
    }

    asPost() {
        return {
            type: this.type || "bilibili",
            author: this.name || "",
            comment: this.comment || "",
            timestamp: this.timestamp,
            iconUrl: this.profileImageUrl || "",
            // Bilibili specific fields
            userLevel: this.userLevel,
            medalLevel: this.medalLevel,
            medalName: this.medalName,
            isVip: this.isVip,
            isSvip: this.isSvip,
            guardLevel: this.guardLevel
        };
    }
}
exports.BilibiliCommon = BilibiliCommon;