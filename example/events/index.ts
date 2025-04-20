import dotenv from "dotenv";
import { Connection, Keypair } from "@solana/web3.js";
import { PumpFunSDK } from "../../src/index.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PumpSwapSDK } from "../../src/pumpswap.js";

const main = async () => {
  dotenv.config();

  if (!process.env.HELIUS_RPC_URL) {
    console.error("Please set HELIUS_RPC_URL in .env file");
    console.error(
      "Example: HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=<your api key>"
    );
    console.error("Get one at: https://www.helius.dev");
    return;
  }

  let connection = new Connection(process.env.HELIUS_RPC_URL || "");

  let wallet = new Wallet(new Keypair()); //note this is not used
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "finalized",
  });

  let pumpFunSDK = new PumpFunSDK(provider);

  let createEvent = pumpFunSDK.addEventListener("createEvent", (event) => {
    console.log("createEvent", event);
  });
  console.log("createEvent", createEvent);

  let tradeEvent = pumpFunSDK.addEventListener("tradeEvent", (event) => {
    console.log("tradeEvent", event);
  });
  console.log("tradeEvent", tradeEvent);

  let completeEvent = pumpFunSDK.addEventListener("completeEvent", (event) => {
    console.log("completeEvent", event);
  });
  console.log("completeEvent", completeEvent);

  const pumpSwapSDK = new PumpSwapSDK(provider);
  let buyEvent = pumpSwapSDK.addEventListener("buyEvent", (event) => {
    console.log("buyEvent", event);
  });
  console.log("buyEvent", buyEvent);

  let sellEvent = pumpSwapSDK.addEventListener("sellEvent", (event) => {
    console.log("sellEvent", event);
  });
  console.log("sellEvent", sellEvent);
};

main();
