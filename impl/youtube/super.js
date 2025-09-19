"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeSuperChat = void 0;
const types_1 = require("../types");
const common_1 = require("./common");
const youtubeSuperApi = "/onecomme/youtube/super";
class YouTubeSuperChat extends common_1.YouTubeCommon {
    constructor(raw, paidText, price, unit, colors, tier) {
        super(raw);
        this.type = "youtube-super";
        this.endpoint = youtubeSuperApi;
        this.paidText = paidText;
        this.price = price;
        this.unit = unit;
        this.colors = colors;
        this.tier = tier;
    }
    asPost() {
        const base = super.asPost();
        if (!base) {
            return undefined;
        }
        const obj = Object.assign(Object.assign({}, base), { paidText: this.paidText, price: this.price, tier: this.tier, unit: this.unit, colors: this.colors });
        return obj;
    }
    getJson() {
        return JSON.stringify(this);
    }
    static fromOneSdk(raw) {
        // スーパーステッカー、メンバーシップギフト、マイルストーンチャットの場合は変換できない
        if (raw.giftType != "superchat")
            return undefined;
        if (!raw.paidText || !raw.price || !raw.unit || !raw.colors || !raw.tier) {
            console.error(`引数の YouTube.CommentResponse が不正な値です。`);
            return undefined;
        }
        let colors = YouTubeSuperChat.convert(raw.colors);
        if (!colors) {
            console.error(`引数の YouTube.CommentResponse が不正な値です。`);
            return undefined;
        }
        return new YouTubeSuperChat(raw, raw.paidText, raw.price, raw.unit, colors, raw.tier);
    }
    static convert(colors) {
        if (!colors)
            return undefined;
        return {
            headerBackgroundColor: types_1.Color.from(colors.headerBackgroundColor),
            headerTextColor: types_1.Color.from(colors.headerTextColor),
            bodyBackgroundColor: types_1.Color.from(colors.bodyBackgroundColor),
            bodyTextColor: types_1.Color.from(colors.bodyTextColor),
            authorNameTextColor: (0, types_1.bind)(colors.authorNameTextColor, types_1.Color.from),
            timestampColor: (0, types_1.bind)(colors.timestampColor, types_1.Color.from)
        };
    }
}
exports.YouTubeSuperChat = YouTubeSuperChat;
