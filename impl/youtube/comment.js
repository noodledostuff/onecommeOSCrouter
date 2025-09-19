"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeComment = void 0;
const common_1 = require("./common");
const youtubeCommentApi = "/onecomme/youtube/comment";
class YouTubeComment extends common_1.YouTubeCommon {
    constructor(raw) {
        super(raw);
        this.type = "youtube";
        this.endpoint = youtubeCommentApi;
    }
    getJson() {
        return JSON.stringify(this);
    }
}
exports.YouTubeComment = YouTubeComment;
