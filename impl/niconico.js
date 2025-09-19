"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NiconamaGift = exports.NiconamaComment = exports.NiconamaCommon = void 0;
const types_1 = require("./types");
const comment_1 = require("./comment");
const niconamaCommentApi = "/onecomme/niconico/comment";
const niconamaGiftApi = "/onecomme/niconico/gift";
class NiconamaCommon {
    constructor(raw) {
        this.id = raw.id;
        this.liveId = raw.liveId;
        this.userId = raw.userId;
        this.name = raw.name;
        this.screenName = raw.screenName;
        this.timestamp = types_1.Timestamp.from(raw.timestamp);
        this.isOwner = raw.isOwner;
        this.hasGift = raw.hasGift;
        this.no = raw.no;
        this.comment = (0, comment_1.normalizeEmoji)(raw.comment);
        this.premium = raw.premium;
        this.anonymity = raw.anonymity;
        this.displayName = raw.displayName;
        this.profileImageUrl = raw.profileImage;
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
exports.NiconamaCommon = NiconamaCommon;
class NiconamaComment extends NiconamaCommon {
    constructor(raw) {
        super(raw);
        this.type = "niconico";
        this.endpoint = niconamaCommentApi;
    }
    getJson() {
        return JSON.stringify(this);
    }
}
exports.NiconamaComment = NiconamaComment;
class NiconamaGift extends NiconamaCommon {
    constructor(raw) {
        super(raw);
        this.type = "niconico-gift";
        this.endpoint = niconamaGiftApi;
        this.price = raw.price;
        this.comment = (0, comment_1.alternateEmoji)(raw.comment);
    }
    asPost() {
        const base = super.asPost();
        if (base === undefined)
            return undefined;
        const obj = Object.assign(Object.assign({}, base), { price: this.price });
        return obj;
    }
    getJson() {
        return JSON.stringify(this);
    }
}
exports.NiconamaGift = NiconamaGift;
