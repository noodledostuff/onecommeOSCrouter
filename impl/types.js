"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timestamp = exports.Color = void 0;
exports.bind = bind;
class Color {
    constructor(r = 255, g = 255, b = 255, a = 1.) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static from(rgba) {
        const result = Color.pattern.exec(rgba);
        if (!result)
            return Color.disabled;
        return new Color(parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseFloat(result[4]));
    }
}
exports.Color = Color;
Color.pattern = /rgba\((\d+),(\d+),(\d+),(\d?\.?\d*)\)/;
Color.disabled = new Color(255, 0, 255, 1);
// タイムスタンプは常にUTCで扱います
// タイムスタンプデータの例
// "timestamp":"2024-06-15T12:58:28.990Z"
class Timestamp {
    constructor(year, month, day, hour, minute, second, ms) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.ms = ms;
    }
    static from(utcString) {
        const date = new Date(utcString);
        return new Timestamp(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }
}
exports.Timestamp = Timestamp;
function bind(variable, func) {
    return variable ? func(variable) : undefined;
}
