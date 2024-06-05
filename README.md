# PumpFunSDK README

## Overview

The `PumpFunSDK` is a TypeScript class designed to interact with the Pump.fun decentralized application. It provides methods for creating, buying, and selling tokens using the Solana blockchain. The SDK handles the necessary transactions and interactions with the Pump.fun program.

## Installation

`
npm i
`

## Usage Example

First you need to create a `.env` file and set your RPC URL like in the `.env.example`

Then you need to fund an account with atleast 0.004 SOL that is generated when running the command below

`
npx ts-node example/basic/index.ts
`

### Constructor

The `PumpFunSDK` class requires a provider for initialization. The provider is used to interact with the Solana network.

```typescript
import { Provider } from '@project-serum/anchor';

const provider = new Provider(connection, wallet, options);
const pumpFunSDK = new PumpFunSDK(provider);
```

### Methods

#### createAndBuy

Creates a new token and buys a specified amount of it.

```typescript
async createAndBuy(
  creator: Keypair,
  mint: Keypair,
  createTokenMetadata: CreateTokenMetadata,
  buyAmountSol: bigint,
  slippageBasisPoints: bigint = 500n,
  priorityFees?: PriorityFee
): Promise<TransactionResult>
```

**Parameters:**
- `creator`: Keypair of the token creator.
- `mint`: Keypair of the mint.
- `createTokenMetadata`: Metadata for the token.
- `buyAmountSol`: Amount in SOL to buy.
- `slippageBasisPoints`: Allowed slippage in basis points.
- `priorityFees`: Optional priority fees.

**Returns:**
- `TransactionResult`: Result of the transaction.

#### buy

Buys a specified amount of an existing token.

```typescript
async buy(
  buyer: Keypair,
  mint: PublicKey,
  buyAmountSol: bigint,
  slippageBasisPoints: bigint = 500n,
  priorityFees?: PriorityFee
): Promise<TransactionResult>
```

**Parameters:**
- `buyer`: Keypair of the buyer.
- `mint`: PublicKey of the token mint.
- `buyAmountSol`: Amount in SOL to buy.
- `slippageBasisPoints`: Allowed slippage in basis points.
- `priorityFees`: Optional priority fees.

**Returns:**
- `TransactionResult`: Result of the transaction.

#### sell

Sells a specified amount of an existing token.

```typescript
async sell(
  seller: Keypair,
  mint: PublicKey,
  sellAmount: bigint,
  slippageBasisPoints: bigint = 500n,
  priorityFees?: PriorityFee
): Promise<TransactionResult>
```

**Parameters:**
- `seller`: Keypair of the seller.
- `mint`: PublicKey of the token mint.
- `sellAmount`: Amount of the token to sell.
- `slippageBasisPoints`: Allowed slippage in basis points.
- `priorityFees`: Optional priority fees.

**Returns:**
- `TransactionResult`: Result of the transaction.

### Event Listeners

#### addEventListener

Adds an event listener for a specified event type.

```typescript
addEventListener<T extends PumpFunEventType>(
  eventType: T,
  callback: (
    event: PumpFunEventHandlers[T],
    slot: number,
    signature: string
  ) => void
): void
```

**Parameters:**
- `eventType`: Type of the event.
- `callback`: Callback function to handle the event.

#### removeEventListener

Removes an event listener by its ID.

```typescript
removeEventListener(eventId: number): void
```

**Parameters:**
- `eventId`: ID of the event listener to remove.

### Helper Methods

The SDK also provides several helper methods for handling transactions and fetching account information:

- `getCreateInstructions`
- `getBuyInstructions`
- `getSellInstructions`
- `getBondingCurveAccount`
- `getGlobalAccount`
- `createTokenMetadata`

### Example

Here is an example of how to create and buy a token using the SDK:

```typescript
import { Keypair } from '@solana/web3.js';
import { PumpFunSDK, CreateTokenMetadata } from './PumpFunSDK';

const creator = Keypair.generate();
const mint = Keypair.generate();
const createTokenMetadata: CreateTokenMetadata = {
  name: "MyToken",
  symbol: "MTK",
  description: "My awesome token",
  filePath: "./path/to/token/image.png",
  twitter: "@mytoken",
  telegram: "@mytokentelegram",
  website: "https://mytokenwebsite.com"
};

const buyAmountSol = BigInt(1000000000); // 1 SOL in lamports

const pumpFunSDK = new PumpFunSDK(provider);

(async () => {
  const result = await pumpFunSDK.createAndBuy(creator, mint, createTokenMetadata, buyAmountSol);
  console.log(result);
})();
```
---
#### Generate by ChatGPT