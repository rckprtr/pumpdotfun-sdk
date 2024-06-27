"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PumpFunSDK = exports.DEFAULT_DECIMALS = exports.METADATA_SEED = exports.BONDING_CURVE_SEED = exports.MINT_AUTHORITY_SEED = exports.GLOBAL_ACCOUNT_SEED = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const globalAccount_1 = require("./globalAccount");
const events_1 = require("./events");
const spl_token_1 = require("@solana/spl-token");
const bondingCurveAccount_1 = require("./bondingCurveAccount");
const bn_js_1 = require("bn.js");
const util_1 = require("./util");
const IDL_1 = require("./IDL");
const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const MPL_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
exports.GLOBAL_ACCOUNT_SEED = "global";
exports.MINT_AUTHORITY_SEED = "mint-authority";
exports.BONDING_CURVE_SEED = "bonding-curve";
exports.METADATA_SEED = "metadata";
exports.DEFAULT_DECIMALS = 6;
class PumpFunSDK {
    program;
    connection;
    constructor(provider) {
        this.program = new anchor_1.Program(IDL_1.IDL, provider);
        this.connection = this.program.provider.connection;
    }
    async createAndBuy(creator, mint, createTokenMetadata, buyAmountSol, slippageBasisPoints = 500n, priorityFees, commitment = util_1.DEFAULT_COMMITMENT, finality = util_1.DEFAULT_FINALITY) {
        let tokenMetadata = await this.createTokenMetadata(createTokenMetadata);
        let createTx = await this.getCreateInstructions(creator.publicKey, createTokenMetadata.name, createTokenMetadata.symbol, tokenMetadata.metadataUri, mint);
        let newTx = new web3_js_1.Transaction().add(createTx);
        if (buyAmountSol > 0) {
            const globalAccount = await this.getGlobalAccount(commitment);
            const buyAmount = globalAccount.getInitialBuyPrice(buyAmountSol);
            const buyAmountWithSlippage = (0, util_1.calculateWithSlippageBuy)(buyAmountSol, slippageBasisPoints);
            const buyTx = await this.getBuyInstructions(creator.publicKey, mint.publicKey, globalAccount.feeRecipient, buyAmount, buyAmountWithSlippage);
            newTx.add(buyTx);
        }
        let createResults = await (0, util_1.sendTx)(this.connection, newTx, creator.publicKey, [creator, mint], priorityFees, commitment, finality);
        return createResults;
    }
    async buy(buyer, mint, buyAmountSol, slippageBasisPoints = 500n, priorityFees, commitment = util_1.DEFAULT_COMMITMENT, finality = util_1.DEFAULT_FINALITY) {
        let buyTx = await this.getBuyInstructionsBySolAmount(buyer.publicKey, mint, buyAmountSol, slippageBasisPoints, commitment);
        let buyResults = await (0, util_1.sendTx)(this.connection, buyTx, buyer.publicKey, [buyer], priorityFees, commitment, finality);
        return buyResults;
    }
    async sell(seller, mint, sellTokenAmount, slippageBasisPoints = 500n, priorityFees, commitment = util_1.DEFAULT_COMMITMENT, finality = util_1.DEFAULT_FINALITY) {
        let sellTx = await this.getSellInstructionsByTokenAmount(seller.publicKey, mint, sellTokenAmount, slippageBasisPoints, commitment);
        let sellResults = await (0, util_1.sendTx)(this.connection, sellTx, seller.publicKey, [seller], priorityFees, commitment, finality);
        return sellResults;
    }
    //create token instructions
    async getCreateInstructions(creator, name, symbol, uri, mint) {
        const mplTokenMetadata = new web3_js_1.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
        const [metadataPDA] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from(exports.METADATA_SEED),
            mplTokenMetadata.toBuffer(),
            mint.publicKey.toBuffer(),
        ], mplTokenMetadata);
        const associatedBondingCurve = await (0, spl_token_1.getAssociatedTokenAddress)(mint.publicKey, this.getBondingCurvePDA(mint.publicKey), true);
        return this.program.methods
            .create(name, symbol, uri)
            .accounts({
            mint: mint.publicKey,
            associatedBondingCurve: associatedBondingCurve,
            metadata: metadataPDA,
            user: creator,
        })
            .signers([mint])
            .transaction();
    }
    async getBuyInstructionsBySolAmount(buyer, mint, buyAmountSol, slippageBasisPoints = 500n, commitment = util_1.DEFAULT_COMMITMENT) {
        let bondingCurveAccount = await this.getBondingCurveAccount(mint, commitment);
        if (!bondingCurveAccount) {
            throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
        }
        let buyAmount = bondingCurveAccount.getBuyPrice(buyAmountSol);
        let buyAmountWithSlippage = (0, util_1.calculateWithSlippageBuy)(buyAmountSol, slippageBasisPoints);
        let globalAccount = await this.getGlobalAccount(commitment);
        return await this.getBuyInstructions(buyer, mint, globalAccount.feeRecipient, buyAmount, buyAmountWithSlippage);
    }
    //buy
    async getBuyInstructions(buyer, mint, feeRecipient, amount, solAmount, commitment = util_1.DEFAULT_COMMITMENT) {
        const associatedBondingCurve = await (0, spl_token_1.getAssociatedTokenAddress)(mint, this.getBondingCurvePDA(mint), true);
        const associatedUser = await (0, spl_token_1.getAssociatedTokenAddress)(mint, buyer, false);
        let transaction = new web3_js_1.Transaction();
        try {
            await (0, spl_token_1.getAccount)(this.connection, associatedUser, commitment);
        }
        catch (e) {
            transaction.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(buyer, associatedUser, buyer, mint));
        }
        transaction.add(await this.program.methods
            .buy(new bn_js_1.BN(amount.toString()), new bn_js_1.BN(solAmount.toString()))
            .accounts({
            feeRecipient: feeRecipient,
            mint: mint,
            associatedBondingCurve: associatedBondingCurve,
            associatedUser: associatedUser,
            user: buyer,
        })
            .transaction());
        return transaction;
    }
    //sell
    async getSellInstructionsByTokenAmount(seller, mint, sellTokenAmount, slippageBasisPoints = 500n, commitment = util_1.DEFAULT_COMMITMENT) {
        let bondingCurveAccount = await this.getBondingCurveAccount(mint, commitment);
        if (!bondingCurveAccount) {
            throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
        }
        let globalAccount = await this.getGlobalAccount(commitment);
        let minSolOutput = bondingCurveAccount.getSellPrice(sellTokenAmount, globalAccount.feeBasisPoints);
        let sellAmountWithSlippage = (0, util_1.calculateWithSlippageSell)(minSolOutput, slippageBasisPoints);
        return await this.getSellInstructions(seller, mint, globalAccount.feeRecipient, sellTokenAmount, sellAmountWithSlippage);
    }
    async getSellInstructions(seller, mint, feeRecipient, amount, minSolOutput) {
        const associatedBondingCurve = await (0, spl_token_1.getAssociatedTokenAddress)(mint, this.getBondingCurvePDA(mint), true);
        const associatedUser = await (0, spl_token_1.getAssociatedTokenAddress)(mint, seller, false);
        let transaction = new web3_js_1.Transaction();
        transaction.add(await this.program.methods
            .sell(new bn_js_1.BN(amount.toString()), new bn_js_1.BN(minSolOutput.toString()))
            .accounts({
            feeRecipient: feeRecipient,
            mint: mint,
            associatedBondingCurve: associatedBondingCurve,
            associatedUser: associatedUser,
            user: seller,
        })
            .transaction());
        return transaction;
    }
    async getBondingCurveAccount(mint, commitment = util_1.DEFAULT_COMMITMENT) {
        const tokenAccount = await this.connection.getAccountInfo(this.getBondingCurvePDA(mint), commitment);
        if (!tokenAccount) {
            return null;
        }
        return bondingCurveAccount_1.BondingCurveAccount.fromBuffer(tokenAccount.data);
    }
    async getGlobalAccount(commitment = util_1.DEFAULT_COMMITMENT) {
        const [globalAccountPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(exports.GLOBAL_ACCOUNT_SEED)], new web3_js_1.PublicKey(PROGRAM_ID));
        const tokenAccount = await this.connection.getAccountInfo(globalAccountPDA, commitment);
        return globalAccount_1.GlobalAccount.fromBuffer(tokenAccount.data);
    }
    getBondingCurvePDA(mint) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(exports.BONDING_CURVE_SEED), mint.toBuffer()], this.program.programId)[0];
    }
    async createTokenMetadata(create) {
        let formData = new FormData();
        formData.append("file", create.file),
            formData.append("name", create.name),
            formData.append("symbol", create.symbol),
            formData.append("description", create.description),
            formData.append("twitter", create.twitter || ""),
            formData.append("telegram", create.telegram || ""),
            formData.append("website", create.website || ""),
            formData.append("showName", "true");
        let request = await fetch("https://pump.fun/api/ipfs", {
            method: "POST",
            body: formData,
        });
        return request.json();
    }
    //EVENTS
    addEventListener(eventType, callback) {
        return this.program.addEventListener(eventType, (event, slot, signature) => {
            let processedEvent;
            switch (eventType) {
                case "createEvent":
                    processedEvent = (0, events_1.toCreateEvent)(event);
                    callback(processedEvent, slot, signature);
                    break;
                case "tradeEvent":
                    processedEvent = (0, events_1.toTradeEvent)(event);
                    callback(processedEvent, slot, signature);
                    break;
                case "completeEvent":
                    processedEvent = (0, events_1.toCompleteEvent)(event);
                    callback(processedEvent, slot, signature);
                    console.log("completeEvent", event, slot, signature);
                    break;
                case "setParamsEvent":
                    processedEvent = (0, events_1.toSetParamsEvent)(event);
                    callback(processedEvent, slot, signature);
                    break;
                default:
                    console.error("Unhandled event type:", eventType);
            }
        });
    }
    removeEventListener(eventId) {
        this.program.removeEventListener(eventId);
    }
}
exports.PumpFunSDK = PumpFunSDK;
