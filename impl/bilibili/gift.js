"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliGift = void 0;
const common_1 = require("./common");
const comment_1 = require("../comment");

const bilibiliGiftApi = "/onecomme/bilibili/gift";

class BilibiliGift extends common_1.BilibiliCommon {
    constructor(raw) {
        super(raw);
        this.type = "bilibili-gift";
        this.endpoint = bilibiliGiftApi;
        
        // Gift specific properties
        this.giftName = raw.giftName || "";
        this.giftId = raw.giftId || 0;
        this.price = raw.price || 0;
        this.num = raw.num || 1;
        this.totalCoin = raw.totalCoin || this.price * this.num;
        this.coinType = raw.coinType || "gold"; // gold, silver
        this.giftType = raw.giftType || 0; // 0=普通礼物, 1=高级礼物
        this.action = raw.action || "投喂";
        
        // For SC (Super Chat) equivalents
        this.isSpecialGift = raw.isSpecialGift || false;
        this.specialGiftType = raw.specialGiftType || ""; // "sc" for super chat equivalent
        
        // Override comment for gifts that might have messages
        this.comment = (0, comment_1.alternateEmoji)(raw.comment || raw.msg || "");
    }

    asPost() {
        const base = super.asPost();
        
        const obj = Object.assign(Object.assign({}, base), { 
            giftName: this.giftName,
            giftId: this.giftId,
            price: this.price,
            num: this.num,
            totalCoin: this.totalCoin,
            coinType: this.coinType,
            giftType: this.giftType,
            action: this.action,
            isSpecialGift: this.isSpecialGift,
            specialGiftType: this.specialGiftType
        });
        return obj;
    }

    getJson() {
        return JSON.stringify(this);
    }

    static fromOneSdk(raw) {
        return new BilibiliGift(raw);
    }
}
exports.BilibiliGift = BilibiliGift;