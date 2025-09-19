"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmoji = normalizeEmoji;
exports.alternateEmoji = alternateEmoji;
exports.resizeYoutubeProfileImageUrl = resizeYoutubeProfileImageUrl;
function decodeEscape(comment) {
    return comment
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&");
}
// 絵文字データの例
// <img src="https://fonts.gstatic.com/s/e/notoemoji/15.1/1f44f/72.png" alt="👏">
const emojiRegex = /<img[^>]*>/g;
const emojiAltRegex = /<img [^>]*alt="([^>]*)"[^>]*>/g;
function normalizeEmoji(comment) {
    var result = comment.replace(emojiRegex, "▯");
    result = decodeEscape(result);
    return result;
}
function alternateEmoji(comment) {
    var result = comment.replace(emojiAltRegex, "$1");
    result = result.replace(emojiRegex, "");
    result = decodeEscape(result);
    return result;
}
const profileImageUrlRegex = /=s(.+)-c-k-c0x00ffffff-no-rj/;
function resizeYoutubeProfileImageUrl(url) {
    return url.replace(profileImageUrlRegex, "=s240-c-k-c0x00ffffff-no-rj");
}
