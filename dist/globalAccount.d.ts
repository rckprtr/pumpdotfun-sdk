/// <reference types="node" />
import { PublicKey } from "@solana/web3.js";
export declare class GlobalAccount {
    discriminator: bigint;
    initialized: boolean;
    authority: PublicKey;
    feeRecipient: PublicKey;
    initialVirtualTokenReserves: bigint;
    initialVirtualSolReserves: bigint;
    initialRealTokenReserves: bigint;
    tokenTotalSupply: bigint;
    feeBasisPoints: bigint;
    constructor(discriminator: bigint, initialized: boolean, authority: PublicKey, feeRecipient: PublicKey, initialVirtualTokenReserves: bigint, initialVirtualSolReserves: bigint, initialRealTokenReserves: bigint, tokenTotalSupply: bigint, feeBasisPoints: bigint);
    getInitialBuyPrice(amount: bigint): bigint;
    static fromBuffer(buffer: Buffer): GlobalAccount;
}
