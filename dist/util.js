"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTxDetails = exports.buildVersionedTx = exports.sendTx = exports.calculateWithSlippageSell = exports.calculateWithSlippageBuy = exports.DEFAULT_FINALITY = exports.DEFAULT_COMMITMENT = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.DEFAULT_COMMITMENT = "finalized";
exports.DEFAULT_FINALITY = "finalized";
const calculateWithSlippageBuy = (amount, basisPoints) => {
    return amount + (amount * basisPoints) / 10000n;
};
exports.calculateWithSlippageBuy = calculateWithSlippageBuy;
const calculateWithSlippageSell = (amount, basisPoints) => {
    return amount - (amount * basisPoints) / 10000n;
};
exports.calculateWithSlippageSell = calculateWithSlippageSell;
async function sendTx(connection, tx, payer, signers, priorityFees, commitment = exports.DEFAULT_COMMITMENT, finality = exports.DEFAULT_FINALITY) {
    let newTx = new web3_js_1.Transaction();
    if (priorityFees) {
        const modifyComputeUnits = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
            units: priorityFees.unitLimit,
        });
        const addPriorityFee = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFees.unitPrice,
        });
        newTx.add(modifyComputeUnits);
        newTx.add(addPriorityFee);
    }
    newTx.add(tx);
    let versionedTx = await (0, exports.buildVersionedTx)(connection, payer, newTx, commitment);
    versionedTx.sign(signers);
    try {
        const sig = await connection.sendTransaction(versionedTx, {
            skipPreflight: false,
        });
        console.log("sig:", `https://solscan.io/tx/${sig}`);
        let txResult = await (0, exports.getTxDetails)(connection, sig, commitment, finality);
        if (!txResult) {
            return {
                success: false,
                error: "Transaction failed",
            };
        }
        return {
            success: true,
            signature: sig,
            results: txResult,
        };
    }
    catch (e) {
        if (e instanceof web3_js_1.SendTransactionError) {
            let ste = e;
            console.log(await ste.getLogs(connection));
        }
        else {
            console.error(e);
        }
        return {
            error: e,
            success: false,
        };
    }
}
exports.sendTx = sendTx;
const buildVersionedTx = async (connection, payer, tx, commitment = exports.DEFAULT_COMMITMENT) => {
    const blockHash = (await connection.getLatestBlockhash(commitment))
        .blockhash;
    let messageV0 = new web3_js_1.TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockHash,
        instructions: tx.instructions,
    }).compileToV0Message();
    return new web3_js_1.VersionedTransaction(messageV0);
};
exports.buildVersionedTx = buildVersionedTx;
const getTxDetails = async (connection, sig, commitment = exports.DEFAULT_COMMITMENT, finality = exports.DEFAULT_FINALITY) => {
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: sig,
    }, commitment);
    return connection.getTransaction(sig, {
        maxSupportedTransactionVersion: 0,
        commitment: finality,
    });
};
exports.getTxDetails = getTxDetails;
