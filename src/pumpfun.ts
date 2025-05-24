import {
  Commitment,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Program, Provider } from "@coral-xyz/anchor";
import { GlobalAccount } from "./globalAccount.js";
import {
  CompleteEvent,
  CreateEvent,
  CreateTokenMetadata,
  PriorityFee,
  PumpFunEventHandlers,
  PumpFunEventType,
  SetParamsEvent,
  TradeEvent,
  TransactionResult,
} from "./types.js";
import {
  toCompleteEvent,
  toCreateEvent,
  toSetParamsEvent,
  toTradeEvent,
} from "./events.js";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BondingCurveAccount } from "./bondingCurveAccount.js";
import { BN } from "bn.js";
import {
  DEFAULT_COMMITMENT,
  DEFAULT_FINALITY,
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
  sendTx,
} from "./util.js";
import { PumpFun, IDL } from "./IDL/index.js";
import { Idl } from "@coral-xyz/anchor";

// SDK Constants
const MPL_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

export const GLOBAL_ACCOUNT_SEED = "global";
export const MINT_AUTHORITY_SEED = "mint-authority";
export const BONDING_CURVE_SEED = "bonding-curve";
export const METADATA_SEED = "metadata";
export const EVENT_AUTHORITY_SEED = "__event_authority";

export const DEFAULT_DECIMALS = 6;

export class PumpFunSDK {
  public program: Program<Idl>;
  public connection: Connection;
  constructor(provider?: Provider) {
    this.program = new Program(IDL as Idl, provider);
    this.connection = this.program.provider.connection;
  }

  async createAndBuy (
    creator: Keypair,
    mint: Keypair,
    createTokenMetadata: CreateTokenMetadata,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    let tokenMetadata = await this.createTokenMetadata(createTokenMetadata);

    let createTx = await this.getCreateInstructions(
      creator.publicKey,
      createTokenMetadata.name,
      createTokenMetadata.symbol,
      tokenMetadata.metadataUri,
      mint
    );

    let newTx = new Transaction().add(createTx);

    if (buyAmountSol > 0) {
      const globalAccount = await this.getGlobalAccount(commitment);
      const buyAmount = globalAccount.getInitialBuyPrice(buyAmountSol);
      const buyAmountWithSlippage = calculateWithSlippageBuy(
        buyAmountSol,
        slippageBasisPoints
      );

      // Instead of calling getBuyInstructions which requires an existing bonding curve,
      // we'll create the buy instruction manually since we know the token is being created

      const bondingCurvePDA = this.getBondingCurvePDA(mint.publicKey);
      
      const associatedBondingCurve = await getAssociatedTokenAddress(
        mint.publicKey,
        bondingCurvePDA,
        true
      );

      // Create associated token account for user if needed
      const associatedUser = await this.createAssociatedTokenAccountIfNeeded(
        creator.publicKey,
        creator.publicKey,
        mint.publicKey,
        newTx,
        commitment
      );

      // Get event authority PDA
      const eventAuthorityPda = this.getEventAuthorityPda();

      // Get global account PDA
      const globalAccountPDA = this.getGlobalAccountPda();

      // Derive creator_vault PDA using the creator's public key (for createAndBuy, bonding curve doesn't exist yet)
      const creatorVaultPda = this.getCreatorVaultPda(creator.publicKey);

      // Create buy instruction using Anchor coder
      const buyInstructionData = this.program.coder.instruction.encode("buy", {
        amount: new BN(buyAmount.toString()),
        maxSolCost: new BN(buyAmountWithSlippage.toString())
      });
      
      // Create accounts array in the exact order
      const accounts = [
        { pubkey: globalAccountPDA, isSigner: false, isWritable: false },
        { pubkey: globalAccount.feeRecipient, isSigner: false, isWritable: true },
        { pubkey: mint.publicKey, isSigner: false, isWritable: false },
        { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
        { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
        { pubkey: associatedUser, isSigner: false, isWritable: true },
        { pubkey: creator.publicKey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
        { pubkey: creatorVaultPda, isSigner: false, isWritable: true },
        { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
        { pubkey: this.program.programId, isSigner: false, isWritable: false }
      ];
      
      newTx.add(
        new TransactionInstruction({
          keys: accounts,
          programId: this.program.programId,
          data: buyInstructionData
        })
      );
    }

    let createResults = await sendTx(
      this.connection,
      newTx,
      creator.publicKey,
      [creator, mint],
      priorityFees,
      commitment,
      finality
    );
    return createResults;
  }

  async buy(
    buyer: Keypair,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    // Get bonding curve account
    const bondingCurvePDA = this.getBondingCurvePDA(mint);
    const bondingAccount = await this.getBondingCurveAccount(mint, commitment);
    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }
    
    // Get global account
    const globalAccountPDA = this.getGlobalAccountPda();
    const globalAccount = await this.getGlobalAccount(commitment);
    
    // Calculate buy amount
    const buyAmount = bondingAccount.getBuyPrice(buyAmountSol);
    const buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );
    
    // Get the associated token accounts
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePDA,
      true
    );
    
    // Get bonding curve creator using helper function
    const bondingCurveCreator = await this.getBondingCurveCreator(bondingCurvePDA, commitment);
    
    // Derive creator_vault PDA using bonding curve creator (not user public key)
    const creatorVaultPda = this.getCreatorVaultPda(bondingCurveCreator);

    // Get event authority PDA
    const eventAuthorityPda = this.getEventAuthorityPda();
    
    // Create a new transaction
    let transaction = new Transaction();
    
    // Add token account creation instruction if needed
    const associatedUser = await this.createAssociatedTokenAccountIfNeeded(
      buyer.publicKey,
      buyer.publicKey,
      mint,
      transaction,
      commitment
    );
    
    // Create buy instruction using Anchor coder
    const buyInstructionData = this.program.coder.instruction.encode("buy", {
      amount: new BN(buyAmount.toString()),
      maxSolCost: new BN(buyAmountWithSlippage.toString())
    });
    
    // Create accounts array in the exact order from buy_token_fixed.ts
    const accounts = [
      { pubkey: globalAccountPDA, isSigner: false, isWritable: false },
      { pubkey: globalAccount.feeRecipient, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedUser, isSigner: false, isWritable: true },
      { pubkey: buyer.publicKey, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false }, // SystemProgram
      { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false }, // TokenProgram
      { pubkey: creatorVaultPda, isSigner: false, isWritable: true },
      { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: this.program.programId, isSigner: false, isWritable: false }
    ];
    
    // Add the buy instruction (manually created to ensure correct account order)
    transaction.add(
      new TransactionInstruction({
        keys: accounts,
        programId: this.program.programId,
        data: buyInstructionData
      })
    );
    
    // Send the transaction
    return await sendTx(
      this.connection,
      transaction,
      buyer.publicKey,
      [buyer],
      priorityFees,
      commitment,
      finality
    );
  }

  async sell(
    seller: Keypair,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    // Get bonding curve account
    const bondingCurvePDA = this.getBondingCurvePDA(mint);
    const bondingAccount = await this.getBondingCurveAccount(mint, commitment);
    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }
    
    // Get global account
    const globalAccountPDA = this.getGlobalAccountPda();
    const globalAccount = await this.getGlobalAccount(commitment);
    
    // Calculate sell amount and slippage
    // Get exact price from bonding curve
    const minSolOutput = bondingAccount.getSellPrice(
      sellTokenAmount,
      globalAccount.feeBasisPoints
    );
    
    // Calculate with percentage-based slippage rather than a fixed value reduction
    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );
    
    // Make sure we don't go below 1 for very small amounts
    if (sellAmountWithSlippage < 1n) {
      sellAmountWithSlippage = 1n;
    }
    
    console.log(`Sell details: amount=${sellTokenAmount}, exactSolOutput=${minSolOutput}, withSlippage=${sellAmountWithSlippage}`);
    
    // Get the associated token accounts
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePDA,
      true
    );
    const sellerPublicKey = seller.publicKey;
    const associatedUser = await getAssociatedTokenAddress(
      mint,
      sellerPublicKey,
      false
    );
    
    // Get bonding curve creator using helper function
    const bondingCurveCreator = await this.getBondingCurveCreator(bondingCurvePDA, commitment);
    
    // Get the creator vault PDA
    const creatorVaultPda = this.getCreatorVaultPda(bondingCurveCreator);
    console.log("Creator vault PDA:", creatorVaultPda.toString());

    // Get event authority PDA
    const eventAuthorityPda = this.getEventAuthorityPda();
    
    // Create a new transaction
    let transaction = new Transaction();
    
    const sellInstructionData = this.program.coder.instruction.encode("sell", {
      amount: new BN(sellTokenAmount.toString()),
      minSolOutput: new BN(sellAmountWithSlippage.toString())
    });
    
    const sellAccounts = [
      { pubkey: globalAccountPDA, isSigner: false, isWritable: false },
      { pubkey: globalAccount.feeRecipient, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedUser, isSigner: false, isWritable: true },
      { pubkey: sellerPublicKey, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
      { pubkey: creatorVaultPda, isSigner: false, isWritable: true },
      { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
      { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: this.program.programId, isSigner: false, isWritable: false }
    ];
    
    let ix = new TransactionInstruction({
      keys: sellAccounts,
      programId: this.program.programId,
      data: sellInstructionData
    });
    
    transaction.add(ix);
    
    // Send the transaction
    return await sendTx(
      this.connection,
      transaction,
      sellerPublicKey,
      [seller],
      priorityFees,
      commitment,
      finality
    );
  }

  //create token instructions
  async getCreateInstructions(
    creator: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    mint: Keypair
  ) {
    const mplTokenMetadata = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        mplTokenMetadata.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      mplTokenMetadata
    );

    const bondingCurvePDA = this.getBondingCurvePDA(mint.publicKey);

    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint.publicKey,
      bondingCurvePDA,
      true
    );

    // Get mint authority PDA
    const [mintAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(MINT_AUTHORITY_SEED)],
      this.program.programId
    );

    // Get global account PDA
    const globalAccountPDA = this.getGlobalAccountPda();

    // Get event authority PDA
    const eventAuthorityPda = this.getEventAuthorityPda();

    // Create instruction manually to avoid typing issues
    const createInstructionData = this.program.coder.instruction.encode("create", {
      name: name,
      symbol: symbol,
      uri: uri,
      creator: creator
    });
    
    const createAccounts = [
      { pubkey: mint.publicKey, isSigner: true, isWritable: true },                    // mint
      { pubkey: mintAuthorityPDA, isSigner: false, isWritable: false },               // mint_authority
      { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },                 // bonding_curve
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },          // associated_bonding_curve
      { pubkey: globalAccountPDA, isSigner: false, isWritable: false },               // global
      { pubkey: mplTokenMetadata, isSigner: false, isWritable: false },               // mpl_token_metadata
      { pubkey: metadataPDA, isSigner: false, isWritable: true },                     // metadata
      { pubkey: creator, isSigner: true, isWritable: true },                          // user
      { pubkey: new PublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false }, // system_program
      { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false }, // token_program
      { pubkey: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID), isSigner: false, isWritable: false }, // associated_token_program
      { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false }, // rent
      { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },              // event_authority
      { pubkey: this.program.programId, isSigner: false, isWritable: false }          // program
    ];
    
    const createInstruction = new TransactionInstruction({
      keys: createAccounts,
      programId: this.program.programId,
      data: createInstructionData
    });
    
    return new Transaction().add(createInstruction);
  }

  async getBuyInstructionsBySolAmount(
    buyer: PublicKey,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    let bondingCurveAccount = await this.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let buyAmount = bondingCurveAccount.getBuyPrice(buyAmountSol);
    let buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );

    let globalAccount = await this.getGlobalAccount(commitment);

    return await this.getBuyInstructions(
      buyer,
      mint,
      globalAccount.feeRecipient,
      buyAmount,
      buyAmountWithSlippage
    );
  }

  //buy
  async getBuyInstructions(
    buyer: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    solAmount: bigint,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const bondingCurvePDA = this.getBondingCurvePDA(mint);
    
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePDA,
      true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, buyer, false);

    // Get bonding curve account to extract creator
    const bondingCurveAccountInfo2 = await this.connection.getAccountInfo(bondingCurvePDA);
    if (!bondingCurveAccountInfo2) {
      throw new Error("Bonding curve account not found");
    }
    
    // Get bonding curve creator using helper function
    const bondingCurveCreator = await this.getBondingCurveCreator(bondingCurvePDA, commitment);

    // Derive creator_vault PDA using bonding curve creator (not user public key)
    const creatorVaultPda = this.getCreatorVaultPda(bondingCurveCreator);

    // Get event authority PDA
    const eventAuthorityPda = this.getEventAuthorityPda();

    let transaction = new Transaction();

    try {
      await getAccount(this.connection, associatedUser, commitment);
    } catch (e) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyer,
          associatedUser,
          buyer,
          mint
        )
      );
    }

    // Get global account PDA
    const globalAccountPDA = this.getGlobalAccountPda();

    // Create buy instruction using Anchor coder
    const buyInstructionData = this.program.coder.instruction.encode("buy", {
      amount: new BN(amount.toString()),
      maxSolCost: new BN(solAmount.toString())
    });
    
    const buyAccounts = [
      { pubkey: globalAccountPDA, isSigner: false, isWritable: false },
      { pubkey: feeRecipient, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedUser, isSigner: false, isWritable: true },
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
      { pubkey: creatorVaultPda, isSigner: false, isWritable: true },
      { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: this.program.programId, isSigner: false, isWritable: false }
    ];
    
    transaction.add(
      new TransactionInstruction({
        keys: buyAccounts,
        programId: this.program.programId,
        data: buyInstructionData
      })
    );

    return transaction;
  }

  //sell
  async getSellInstructionsByTokenAmount(
    seller: PublicKey,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    let bondingCurveAccount = await this.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let globalAccount = await this.getGlobalAccount(commitment);

    // Get exact price from bonding curve
    const minSolOutput = bondingCurveAccount.getSellPrice(
      sellTokenAmount,
      globalAccount.feeBasisPoints
    );
    
    // Calculate with percentage-based slippage rather than a fixed value reduction
    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );
    
    // Make sure we don't go below 1 for very small amounts
    if (sellAmountWithSlippage < 1n) {
      sellAmountWithSlippage = 1n;
    }

    console.log(`getSellInstructionsByTokenAmount - amount=${sellTokenAmount}, exactOutput=${minSolOutput}, withSlippage=${sellAmountWithSlippage}`);

    return await this.getSellInstructions(
      seller,
      mint,
      globalAccount.feeRecipient,
      sellTokenAmount,
      sellAmountWithSlippage
    );
  }

  async getSellInstructions(
    seller: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    minSolOutput: bigint,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const bondingCurvePDA = this.getBondingCurvePDA(mint);
    
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePDA,
      true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, seller, false);

    let transaction = new Transaction();

    // Get global account PDA
    const globalAccountPDA = this.getGlobalAccountPda();

    const bondingCurveCreator = await this.getBondingCurveCreator(bondingCurvePDA, commitment);
    
    // Derive creator_vault PDA using bonding curve creator
    const creatorVaultPda = this.getCreatorVaultPda(bondingCurveCreator);

    // Get event authority PDA
    const eventAuthorityPda = this.getEventAuthorityPda();

    // Check IDL for the correct order of accounts
    const accounts = [
      { pubkey: globalAccountPDA, isSigner: false, isWritable: false },
      { pubkey: feeRecipient, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedUser, isSigner: false, isWritable: true },
      { pubkey: seller, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
      { pubkey: creatorVaultPda, isSigner: false, isWritable: true },
      { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: this.program.programId, isSigner: false, isWritable: false }
    ];

    // Create the sell instruction with BN values for amount and minSolOutput
    const instructionData = this.program.coder.instruction.encode("sell", {
      amount: new BN(amount.toString()),
      minSolOutput: new BN(minSolOutput.toString())
    });

    // Add the instruction to the transaction
    transaction.add(
      new TransactionInstruction({
        keys: accounts,
        programId: this.program.programId,
        data: instructionData
      })
    );

    return transaction;
  }

  async getBondingCurveAccount(
    mint: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const tokenAccount = await this.connection.getAccountInfo(
      this.getBondingCurvePDA(mint),
      commitment
    );
    if (!tokenAccount) {
      return null;
    }
    return BondingCurveAccount.fromBuffer(tokenAccount!.data);
  }

  async getGlobalAccount(commitment: Commitment = DEFAULT_COMMITMENT) {
    const globalAccountPDA = this.getGlobalAccountPda();

    const tokenAccount = await this.connection.getAccountInfo(
      globalAccountPDA,
      commitment
    );

    return GlobalAccount.fromBuffer(tokenAccount!.data);
  }

  getBondingCurvePDA(mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
      this.program.programId
    )[0];
  }

  private async getBondingCurveCreator(
    bondingCurvePDA: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<PublicKey> {
    const bondingAccountInfo = await this.connection.getAccountInfo(bondingCurvePDA, commitment);
    if (!bondingAccountInfo) {
      throw new Error("Bonding curve account not found");
    }

    // Creator is at offset 49 (after 8 bytes discriminator, 5 u64 fields, and 1 byte boolean)
    const creatorBytes = bondingAccountInfo.data.subarray(49, 49 + 32);
    return new PublicKey(creatorBytes);
  }

  async createTokenMetadata(create: CreateTokenMetadata) {
    // Validate file
    if (!(create.file instanceof Blob)) {
        throw new Error('File must be a Blob or File object');
    }

    let formData = new FormData();
    formData.append("file", create.file, 'image.png'); // Add filename
    formData.append("name", create.name);
    formData.append("symbol", create.symbol);
    formData.append("description", create.description);
    formData.append("twitter", create.twitter || "");
    formData.append("telegram", create.telegram || "");
    formData.append("website", create.website || "");
    formData.append("showName", "true");

    try {
        const request = await fetch("https://pump.fun/api/ipfs", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
            },
            body: formData,
            credentials: 'same-origin'
        });

        if (request.status === 500) {
            // Try to get more error details
            const errorText = await request.text();
            throw new Error(`Server error (500): ${errorText || 'No error details available'}`);
        }

        if (!request.ok) {
            throw new Error(`HTTP error! status: ${request.status}`);
        }

        const responseText = await request.text();
        if (!responseText) {
            throw new Error('Empty response received from server');
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Invalid JSON response: ${responseText}`);
        }
    } catch (error) {
        console.error('Error in createTokenMetadata:', error);
        throw error;
    }
  }


  private getCreatorVaultPda(creator: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), creator.toBuffer()],
      this.program.programId
    )[0];
  }

  private getGlobalAccountPda(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      this.program.programId
    )[0];
  }

  private getEventAuthorityPda(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(EVENT_AUTHORITY_SEED)],
      this.program.programId
    )[0];
  }

  private async createAssociatedTokenAccountIfNeeded(
    payer: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    transaction: Transaction,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<PublicKey> {
    const associatedTokenAccount = await getAssociatedTokenAddress(mint, owner, false);
    
    try {
      await getAccount(this.connection, associatedTokenAccount, commitment);
    } catch (e) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          associatedTokenAccount,
          owner,
          mint
        )
      );
    }
    
    return associatedTokenAccount;
  }
  //EVENTS
  addEventListener<T extends PumpFunEventType>(
    eventType: T,
    callback: (
      event: PumpFunEventHandlers[T],
      slot: number,
      signature: string
    ) => void
  ) {
    return this.program.addEventListener(
      eventType,
      (event: any, slot: number, signature: string) => {
        let processedEvent;
        switch (eventType) {
          case "createEvent":
            processedEvent = toCreateEvent(event as CreateEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            break;
          case "tradeEvent":
            processedEvent = toTradeEvent(event as TradeEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            break;
          case "completeEvent":
            processedEvent = toCompleteEvent(event as CompleteEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            break;
          case "setParamsEvent":
            processedEvent = toSetParamsEvent(event as SetParamsEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            break;
          default:
            console.error("Unhandled event type:", eventType);
        }
      }
    );
  }

  removeEventListener(eventId: number) {
    this.program.removeEventListener(eventId);
  }

}
