import { Commitment, Connection, Finality, Keypair, PublicKey, Transaction, VersionedTransaction, VersionedTransactionResponse } from "@solana/web3.js";
import { PriorityFee, TransactionResult } from "./types";
export declare const DEFAULT_COMMITMENT: Commitment;
export declare const DEFAULT_FINALITY: Finality;
export declare const calculateWithSlippageBuy: (amount: bigint, basisPoints: bigint) => bigint;
export declare const calculateWithSlippageSell: (amount: bigint, basisPoints: bigint) => bigint;
export declare function sendTx(connection: Connection, tx: Transaction, payer: PublicKey, signers: Keypair[], priorityFees?: PriorityFee, commitment?: Commitment, finality?: Finality): Promise<TransactionResult>;
export declare const buildVersionedTx: (connection: Connection, payer: PublicKey, tx: Transaction, commitment?: Commitment) => Promise<VersionedTransaction>;
export declare const getTxDetails: (connection: Connection, sig: string, commitment?: Commitment, finality?: Finality) => Promise<VersionedTransactionResponse | null>;
