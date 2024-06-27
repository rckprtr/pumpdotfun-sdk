/// <reference types="node" />
export declare class BondingCurveAccount {
    discriminator: bigint;
    virtualTokenReserves: bigint;
    virtualSolReserves: bigint;
    realTokenReserves: bigint;
    realSolReserves: bigint;
    tokenTotalSupply: bigint;
    complete: boolean;
    constructor(discriminator: bigint, virtualTokenReserves: bigint, virtualSolReserves: bigint, realTokenReserves: bigint, realSolReserves: bigint, tokenTotalSupply: bigint, complete: boolean);
    getBuyPrice(amount: bigint): bigint;
    getSellPrice(amount: bigint, feeBasisPoints: bigint): bigint;
    getMarketCapSOL(): bigint;
    getFinalMarketCapSOL(feeBasisPoints: bigint): bigint;
    getBuyOutPrice(amount: bigint, feeBasisPoints: bigint): bigint;
    static fromBuffer(buffer: Buffer): BondingCurveAccount;
}
