import { Connection, PublicKey } from "@solana/web3.js";
import { PumpSwap, PumpSwapIDL } from "./IDL/index.js";
import { Program, Provider } from "@coral-xyz/anchor";
import {
  BuyEvent,
  PumpSwapEventHandlers,
  PumpSwapEventType,
  SellEvent,
} from "./types.js";
import { toBuyEvent, toSellEvent } from "./events.js";

export class PumpSwapSDK {
  public readonly program: Program<PumpSwap>;
  public readonly connection: Connection;
  constructor(provider?: Provider) {
    this.program = new Program<PumpSwap>(PumpSwapIDL, provider);
    this.connection = this.program.provider.connection;
  }

  addEventListener<T extends PumpSwapEventType>(
    eventType: T,
    callback: (event: any, slot: number, signature: string) => void
  ) {
    return this.program.addEventListener(
      eventType as any,
      (event: any, slot: number, signature: string) => {
        let processedEvent;
        switch (eventType) {
          case "buyEvent":
            processedEvent = toBuyEvent(event as BuyEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "sellEvent":
            processedEvent = toSellEvent(event as SellEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          default:
            throw new Error(`Unknown event type: ${eventType}`);
        }
      }
    );
  }
  removeEventListener(eventId: number) {
    this.program.removeEventListener(eventId);
  }
}
