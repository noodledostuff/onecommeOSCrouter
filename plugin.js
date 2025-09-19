"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_osc_1 = require("node-osc");
const niconico_1 = require("./impl/niconico");
const index_1 = require("./impl/youtube/index");
const bilibili_1 = require("./impl/bilibili/index");
const endpoint = "127.0.0.1";
const port = 19100;
const defaultPostApi = "/onecomme/common";
class MessageConverter {
    convert(comment) {
        let service = comment.service;
        let data = comment.data;
        if (service == "youtube" && this.isYouTubeComment(data)) {
            const asSuper = this.toYouTubeSuper(data);
            return asSuper ? asSuper : new index_1.YouTubeComment(data);
        }
        if (service == "niconama" && this.isNiconamaComment(data)) {
            return data.hasGift
                ? new niconico_1.NiconamaGift(data)
                : new niconico_1.NiconamaComment(data);
        }
        if (service == "bilibili" && this.isBilibiliComment(data)) {
            return data.hasGift
                ? new bilibili_1.BilibiliGift(data)
                : new bilibili_1.BilibiliComment(data);
        }
        return undefined;
    }
    toYouTubeSuper(raw) {
        if (!raw.hasGift)
            return undefined;
        return index_1.YouTubeSuperChat.fromOneSdk(raw);
    }
    isYouTubeComment(subject) {
        return subject !== undefined;
    }
    isNiconamaComment(subject) {
        return subject !== undefined;
    }
    isBilibiliComment(subject) {
        return subject !== undefined;
    }
}
class Domain {
    constructor() {
        this.uid = "onecomme-osc";
        this.name = "VirtualCast公式わんコメOSCプラグイン";
        this.version = "1.3.1";
        this.author = "Virtual Cast, Inc.";
        this.url = "https://wiki.virtualcast.jp/wiki/deliverytool/onecomme/plugin";
        this.permissions = [
            "comments",
        ];
        this.defaultState = {};
        // Custom
        this.converter = new MessageConverter();
        this.client = null;
    }
    init(_api, _initialData) {
        console.info("onecomme-osc initializing.");
        this.client = new node_osc_1.Client(endpoint, port);
    }
    destroy() {
        var _a;
        console.info("onecomme-osc disposing.");
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.close();
        this.client = null;
    }
    subscribe(type, ...args) {
        console.info(`onecomme-osc subscription notified. Type of ${type}`);
        if (type != "comments")
            return;
        args.forEach(x => {
            if (!x.comments)
                return;
            this.processComments(x.comments);
        });
    }
    processComments(comments) {
        comments.forEach((cm) => {
            try {
                const subject = this.converter.convert(cm);
                if (subject === undefined)
                    return;
                
                // Send OSC message for specific endpoint
                try {
                    const json = subject.getJson();
                    const jsonUtf8 = Buffer.from(json, "utf-8");
                    this.send(subject.endpoint, jsonUtf8);
                } catch (oscError) {
                    console.error(`Failed to send OSC message for ${cm.service}: ${oscError.message}`);
                }
                
                // Send common API message
                try {
                    const post = subject.asPost();
                    if (post !== undefined) {
                        const postJson = JSON.stringify(post);
                        const postUtf8 = Buffer.from(postJson, "utf-8");
                        this.send(defaultPostApi, postUtf8);
                    }
                } catch (commonError) {
                    console.error(`Failed to send common API message for ${cm.service}: ${commonError.message}`);
                }
            } catch (error) {
                console.error(`Failed to process comment from ${cm.service}: ${error.message}`);
            }
        });
    }
    send(oscEndpoint, data) {
        var _a;
        console.info(`send message; ${data}; destination: ${oscEndpoint}`);
        const message = new node_osc_1.Message(oscEndpoint, data);
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.send(message);
    }
}
module.exports = new Domain();
