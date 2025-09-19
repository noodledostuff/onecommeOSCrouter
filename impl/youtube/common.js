"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeCommon = void 0;
const types_1 = require("../types");
const comment_1 = require("../comment");
class YouTubeCommon {
    constructor(raw) {
        this.id = raw.id;
        this.liveId = raw.liveId;
        this.userId = raw.userId;
        this.name = raw.name;
        this.isOwner = raw.isOwner;
        this.isModerator = raw.isModerator;
        this.isMember = raw.isMember;
        this.autoModerated = raw.autoModerated;
        this.timestamp = types_1.Timestamp.from(raw.timestamp);
        this.hasGift = raw.hasGift;
        this.comment = (0, comment_1.normalizeEmoji)(raw.comment);
        this.displayName = raw.displayName;
        this.profileImageUrl = raw.profileImage ? (0, comment_1.resizeYoutubeProfileImageUrl)(raw.profileImage) : "";
    }
    asPost() {
        return {
            type: this.type,
            author: this.name,
            comment: this.comment,
            timestamp: this.timestamp,
            iconUrl: this.profileImageUrl
        };
    }
}
exports.YouTubeCommon = YouTubeCommon;
