import { BondingCurveAccount } from "./bondingCurveAccount";
import { GlobalAccount } from "./globalAccount";
export type BuyResult = {
    token_amount: bigint;
    sol_amount: bigint;
};
export type SellResult = {
    token_amount: bigint;
    sol_amount: bigint;
};
export declare class AMM {
    virtualSolReserves: bigint;
    virtualTokenReserves: bigint;
    realSolReserves: bigint;
    realTokenReserves: bigint;
    initialVirtualTokenReserves: bigint;
    constructor(virtualSolReserves: bigint, virtualTokenReserves: bigint, realSolReserves: bigint, realTokenReserves: bigint, initialVirtualTokenReserves: bigint);
    static fromGlobalAccount(global: GlobalAccount): AMM;
    static fromBondingCurveAccount(bonding_curve: BondingCurveAccount, initialVirtualTokenReserves: bigint): AMM;
    getBuyPrice(tokens: bigint): bigint;
    applyBuy(token_amount: bigint): BuyResult;
    applySell(token_amount: bigint): SellResult;
    getSellPrice(tokens: bigint): bigint;
}
