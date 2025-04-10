import { PublicKey } from "@solana/web3.js";
import {
  BuyEvent,
  CompleteEvent,
  CreateEvent,
  SellEvent,
  SetParamsEvent,
  TradeEvent,
} from "./types.js";

export function toCreateEvent(event: CreateEvent): CreateEvent {
  return {
    name: event.name,
    symbol: event.symbol,
    uri: event.uri,
    mint: new PublicKey(event.mint),
    bondingCurve: new PublicKey(event.bondingCurve),
    user: new PublicKey(event.user),
  };
}

export function toCompleteEvent(event: CompleteEvent): CompleteEvent {
  return {
    user: new PublicKey(event.user),
    mint: new PublicKey(event.mint),
    bondingCurve: new PublicKey(event.bondingCurve),
    timestamp: Number(event.timestamp),
  };
}

export function toTradeEvent(event: TradeEvent): TradeEvent {
  return {
    mint: new PublicKey(event.mint),
    solAmount: BigInt(event.solAmount),
    tokenAmount: BigInt(event.tokenAmount),
    isBuy: event.isBuy,
    user: new PublicKey(event.user),
    timestamp: Number(event.timestamp),
    virtualSolReserves: BigInt(event.virtualSolReserves),
    virtualTokenReserves: BigInt(event.virtualTokenReserves),
    realSolReserves: BigInt(event.realSolReserves),
    realTokenReserves: BigInt(event.realTokenReserves),
  };
}

export function toSetParamsEvent(event: SetParamsEvent): SetParamsEvent {
  return {
    feeRecipient: new PublicKey(event.feeRecipient),
    initialVirtualTokenReserves: BigInt(event.initialVirtualTokenReserves),
    initialVirtualSolReserves: BigInt(event.initialVirtualSolReserves),
    initialRealTokenReserves: BigInt(event.initialRealTokenReserves),
    tokenTotalSupply: BigInt(event.tokenTotalSupply),
    feeBasisPoints: BigInt(event.feeBasisPoints),
  };
}

export function toBuyEvent(event: BuyEvent): BuyEvent {
  return {
    timestamp: Number(event.timestamp),
    baseAmountOut: BigInt(event.baseAmountOut),
    maxQuoteAmountIn: BigInt(event.maxQuoteAmountIn),
    userBaseTokenReserves: BigInt(event.userBaseTokenReserves),
    userQuoteTokenReserves: BigInt(event.userQuoteTokenReserves),
    poolBaseTokenReserves: BigInt(event.poolBaseTokenReserves),
    poolQuoteTokenReserves: BigInt(event.poolQuoteTokenReserves),
    quoteAmountIn: BigInt(event.quoteAmountIn),
    lpFeeBasisPoints: BigInt(event.lpFeeBasisPoints),
    lpFee: BigInt(event.lpFee),
    protocolFeeBasisPoints: BigInt(event.protocolFeeBasisPoints),
    protocolFee: BigInt(event.protocolFee),
    quoteAmountInWithLpFee: BigInt(event.quoteAmountInWithLpFee),
    userQuoteAmountIn: BigInt(event.userQuoteAmountIn),
    pool: new PublicKey(event.pool),
    user: new PublicKey(event.user),
    userBaseTokenAccount: new PublicKey(event.userBaseTokenAccount),
    userQuoteTokenAccount: new PublicKey(event.userQuoteTokenAccount),
    protocolFeeRecipient: new PublicKey(event.protocolFeeRecipient),
    protocolFeeRecipientTokenAccount: new PublicKey(
      event.protocolFeeRecipientTokenAccount
    ),
  };
}

export function toSellEvent(event: SellEvent): SellEvent {
  return {
    timestamp: Number(event.timestamp),
    baseAmountIn: BigInt(event.baseAmountIn),
    minQuoteAmountOut: BigInt(event.minQuoteAmountOut),
    userBaseTokenReserves: BigInt(event.userBaseTokenReserves),
    userQuoteTokenReserves: BigInt(event.userQuoteTokenReserves),
    poolBaseTokenReserves: BigInt(event.poolBaseTokenReserves),
    poolQuoteTokenReserves: BigInt(event.poolQuoteTokenReserves),
    quoteAmountOut: BigInt(event.quoteAmountOut),
    lpFeeBasisPoints: BigInt(event.lpFeeBasisPoints),
    lpFee: BigInt(event.lpFee),
    protocolFeeBasisPoints: BigInt(event.protocolFeeBasisPoints),
    protocolFee: BigInt(event.protocolFee),
    quoteAmountOutWithoutLpFee: BigInt(event.quoteAmountOutWithoutLpFee),
    userQuoteAmountOut: BigInt(event.userQuoteAmountOut),
    pool: new PublicKey(event.pool),
    user: new PublicKey(event.user),
    userBaseTokenAccount: new PublicKey(event.userBaseTokenAccount),
    userQuoteTokenAccount: new PublicKey(event.userQuoteTokenAccount),
    protocolFeeRecipient: new PublicKey(event.protocolFeeRecipient),
    protocolFeeRecipientTokenAccount: new PublicKey(
      event.protocolFeeRecipientTokenAccount
    ),
  };
}
