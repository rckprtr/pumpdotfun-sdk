"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSetParamsEvent = exports.toTradeEvent = exports.toCompleteEvent = exports.toCreateEvent = void 0;
const web3_js_1 = require("@solana/web3.js");
function toCreateEvent(event) {
    return {
        name: event.name,
        symbol: event.symbol,
        uri: event.uri,
        mint: new web3_js_1.PublicKey(event.mint),
        bondingCurve: new web3_js_1.PublicKey(event.bondingCurve),
        user: new web3_js_1.PublicKey(event.user),
    };
}
exports.toCreateEvent = toCreateEvent;
function toCompleteEvent(event) {
    return {
        user: new web3_js_1.PublicKey(event.user),
        mint: new web3_js_1.PublicKey(event.mint),
        bondingCurve: new web3_js_1.PublicKey(event.bondingCurve),
        timestamp: event.timestamp,
    };
}
exports.toCompleteEvent = toCompleteEvent;
function toTradeEvent(event) {
    return {
        mint: new web3_js_1.PublicKey(event.mint),
        solAmount: BigInt(event.solAmount),
        tokenAmount: BigInt(event.tokenAmount),
        isBuy: event.isBuy,
        user: new web3_js_1.PublicKey(event.user),
        timestamp: Number(event.timestamp),
        virtualSolReserves: BigInt(event.virtualSolReserves),
        virtualTokenReserves: BigInt(event.virtualTokenReserves),
        realSolReserves: BigInt(event.realSolReserves),
        realTokenReserves: BigInt(event.realTokenReserves),
    };
}
exports.toTradeEvent = toTradeEvent;
function toSetParamsEvent(event) {
    return {
        feeRecipient: new web3_js_1.PublicKey(event.feeRecipient),
        initialVirtualTokenReserves: BigInt(event.initialVirtualTokenReserves),
        initialVirtualSolReserves: BigInt(event.initialVirtualSolReserves),
        initialRealTokenReserves: BigInt(event.initialRealTokenReserves),
        tokenTotalSupply: BigInt(event.tokenTotalSupply),
        feeBasisPoints: BigInt(event.feeBasisPoints),
    };
}
exports.toSetParamsEvent = toSetParamsEvent;
