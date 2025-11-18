"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchComment = void 0;
const common_1 = require("./common");

const twitchCommentApi = "/onecomme/twitch/comment";

class TwitchComment extends common_1.TwitchCommon {
    constructor(raw) {
        super(raw);
        this.type = "twitch";
        this.endpoint = twitchCommentApi;
        
        // Additional comment-specific properties
        this.replyTo = raw.replyTo || null; // Parent message ID for replies
        this.isReply = raw.isReply || false;
        this.replyParentDisplayName = raw.replyParentDisplayName || "";
        this.replyParentMsgBody = raw.replyParentMsgBody || "";
        
        // Highlight/pinned message
        this.isHighlight = raw.isHighlight || false;
        this.msgId = raw.msgId || this.id;
        
        // System message detection
        this.isSystemMessage = raw.isSystemMessage || false;
        this.systemMessageType = raw.systemMessageType || ""; // "user_intro", "raid", etc.
    }

    getJson() {
        return JSON.stringify(this);
    }
    
    asPost() {
        const base = super.asPost();
        
        const obj = Object.assign(Object.assign({}, base), {
            replyTo: this.replyTo,
            isReply: this.isReply,
            replyParentDisplayName: this.replyParentDisplayName,
            replyParentMsgBody: this.replyParentMsgBody,
            isHighlight: this.isHighlight,
            msgId: this.msgId,
            isSystemMessage: this.isSystemMessage,
            systemMessageType: this.systemMessageType
        });
        
        return obj;
    }

    static fromOneSdk(raw) {
        return new TwitchComment(raw);
    }
}
exports.TwitchComment = TwitchComment;