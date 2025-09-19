"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliComment = void 0;
const common_1 = require("./common");

const bilibiliCommentApi = "/onecomme/bilibili/comment";

class BilibiliComment extends common_1.BilibiliCommon {
    constructor(raw) {
        super(raw);
        this.type = "bilibili";
        this.endpoint = bilibiliCommentApi;
    }

    getJson() {
        return JSON.stringify(this);
    }
}
exports.BilibiliComment = BilibiliComment;