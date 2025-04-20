import { PublicKey, VersionedTransactionResponse } from "@solana/web3.js";

export type CreateTokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  file: Blob;
  twitter?: string;
  telegram?: string;
  website?: string;
};

export type TokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  showName: boolean;
  createdOn: string;
  twitter: string;
};

export type CreateEvent = {
  name: string;
  symbol: string;
  uri: string;
  mint: PublicKey;
  bondingCurve: PublicKey;
  user: PublicKey;
};

export type TradeEvent = {
  mint: PublicKey;
  solAmount: bigint;
  tokenAmount: bigint;
  isBuy: boolean;
  user: PublicKey;
  timestamp: number;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
  realSolReserves: bigint;
  realTokenReserves: bigint;
};

export type CompleteEvent = {
  user: PublicKey;
  mint: PublicKey;
  bondingCurve: PublicKey;
  timestamp: number;
};

export type SetParamsEvent = {
  feeRecipient: PublicKey;
  initialVirtualTokenReserves: bigint;
  initialVirtualSolReserves: bigint;
  initialRealTokenReserves: bigint;
  tokenTotalSupply: bigint;
  feeBasisPoints: bigint;
};

export interface PumpFunEventHandlers {
  createEvent: CreateEvent;
  tradeEvent: TradeEvent;
  completeEvent: CompleteEvent;
  setParamsEvent: SetParamsEvent;
}

export type PumpFunEventType = keyof PumpFunEventHandlers;

export type PriorityFee = {
  unitLimit: number;
  unitPrice: number;
};

export type TransactionResult = {
  signature?: string;
  error?: unknown;
  results?: VersionedTransactionResponse;
  success: boolean;
};

export type BuyEvent = {
  timestamp: number;
  baseAmountOut: bigint;
  maxQuoteAmountIn: bigint;
  userBaseTokenReserves: bigint;
  userQuoteTokenReserves: bigint;
  poolBaseTokenReserves: bigint;
  poolQuoteTokenReserves: bigint;
  quoteAmountIn: bigint;
  lpFeeBasisPoints: bigint;
  lpFee: bigint;
  protocolFeeBasisPoints: bigint;
  protocolFee: bigint;
  quoteAmountInWithLpFee: bigint;
  userQuoteAmountIn: bigint;
  pool: PublicKey;
  user: PublicKey;
  userBaseTokenAccount: PublicKey;
  userQuoteTokenAccount: PublicKey;
  protocolFeeRecipient: PublicKey;
  protocolFeeRecipientTokenAccount: PublicKey;
};

export type SellEvent = {
  timestamp: number;
  baseAmountIn: bigint;
  minQuoteAmountOut: bigint;
  userBaseTokenReserves: bigint;
  userQuoteTokenReserves: bigint;
  poolBaseTokenReserves: bigint;
  poolQuoteTokenReserves: bigint;
  quoteAmountOut: bigint;
  lpFeeBasisPoints: bigint;
  lpFee: bigint;
  protocolFeeBasisPoints: bigint;
  protocolFee: bigint;
  quoteAmountOutWithoutLpFee: bigint;
  userQuoteAmountOut: bigint;
  pool: PublicKey;
  user: PublicKey;
  userBaseTokenAccount: PublicKey;
  userQuoteTokenAccount: PublicKey;
  protocolFeeRecipient: PublicKey;
  protocolFeeRecipientTokenAccount: PublicKey;
};

export type CreateConfigEvent = {
  timestamp: number;
  admin: PublicKey;
  lpFeeBasisPoints: bigint;
  protocolFeeBasisPoints: bigint;
  protocolFeeRecipients: PublicKey[];
};

export type CreatePoolEvent = {
  timestamp: number;
  index: number;
  creator: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseMintDecimals: number;
  quoteMintDecimals: number;
  baseAmountIn: bigint;
  quoteAmountIn: bigint;
  poolBaseAmount: bigint;
  poolQuoteAmount: bigint;
  minimumLiquidity: bigint;
  initialLiquidity: bigint;
  lpTokenAmountOut: bigint;
  poolBump: number;
  pool: PublicKey;
  lpMint: PublicKey;
  userBaseTokenAccount: PublicKey;
  userQuoteTokenAccount: PublicKey;
};

export type DepositEvent = {
  timestamp: number;
  lpTokenAmountOut: bigint;
  maxBaseAmountIn: bigint;
  maxQuoteAmountIn: bigint;
  userBaseTokenReserves: bigint;
  userQuoteTokenReserves: bigint;
  poolBaseTokenReserves: bigint;
  poolQuoteTokenReserves: bigint;
  baseAmountIn: bigint;
  quoteAmountIn: bigint;
  lpMintSupply: bigint;
  pool: PublicKey;
  user: PublicKey;
  userBaseTokenAccount: PublicKey;
  userQuoteTokenAccount: PublicKey;
  userPoolTokenAccount: PublicKey;
};

export type DisableEvent = {
  timestamp: number;
  admin: PublicKey;
  disableCreatePool: boolean;
  disableDeposit: boolean;
  disableWithdraw: boolean;
  disableBuy: boolean;
  disableSell: boolean;
};

export type ExtendAccountEvent = {
  timestamp: number;
  account: PublicKey;
  user: PublicKey;
  currentSize: bigint;
  newSize: bigint;
};

export type UpdateAdminEvent = {
  timestamp: number;
  admin: PublicKey;
  newAdmin: PublicKey;
};

export type UpdateFeeConfigEvent = {
  timestamp: number;
  admin: PublicKey;
  lpFeeBasisPoints: bigint;
  protocolFeeBasisPoints: bigint;
  protocolFeeRecipients: PublicKey[];
};

export type WithdrawEvent = {
  timestamp: number;
  lpTokenAmountIn: bigint;
  minBaseAmountOut: bigint;
  minQuoteAmountOut: bigint;
  userBaseTokenReserves: bigint;
  userQuoteTokenReserves: bigint;
  poolBaseTokenReserves: bigint;
  poolQuoteTokenReserves: bigint;
  baseAmountOut: bigint;
  quoteAmountOut: bigint;
  lpMintSupply: bigint;
  pool: PublicKey;
  user: PublicKey;
  userBaseTokenAccount: PublicKey;
  userQuoteTokenAccount: PublicKey;
  userPoolTokenAccount: PublicKey;
};

export type PumpSwapEventHandlers = {
  buyEvent: BuyEvent;
  sellEvent: SellEvent;
  createConfigEvent: CreateConfigEvent;
  createPoolEvent: CreatePoolEvent;
  depositEvent: DepositEvent;
  disableEvent: DisableEvent;
  extendAccountEvent: ExtendAccountEvent;
  updateAdminEvent: UpdateAdminEvent;
  updateFeeConfigEvent: UpdateFeeConfigEvent;
  withdrawEvent: WithdrawEvent;
};

export type PumpSwapEventType = keyof PumpSwapEventHandlers;

