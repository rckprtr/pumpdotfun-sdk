import { Connection, PublicKey } from "@solana/web3.js";
import { PumpSwap, PumpSwapIDL } from "./IDL/index.js";
import { Program, Provider } from "@coral-xyz/anchor";
import {
  BuyEvent,
  CreateConfigEvent,
  CreatePoolEvent,
  DepositEvent,
  DisableEvent,
  ExtendAccountEvent,
  PumpSwapEventHandlers,
  PumpSwapEventType,
  SellEvent,
  UpdateAdminEvent,
  UpdateFeeConfigEvent,
  WithdrawEvent,


} from "./types.js";
import { toBuyEvent, toCreateConfigEvent, toCreatePoolEvent, toDepositEvent, toDisableEvent, toExtendAccountEvent, toSellEvent, toUpdateAdminEvent, toUpdateFeeConfigEvent, toWithdrawEvent } from "./events.js";

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
          case "createConfigEvent":
            processedEvent = toCreateConfigEvent(event as CreateConfigEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "createPoolEvent":
            processedEvent = toCreatePoolEvent(event as CreatePoolEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "depositEvent":
            processedEvent = toDepositEvent(event as DepositEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "disableEvent":
            processedEvent = toDisableEvent(event as DisableEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "extendAccountEvent":
            processedEvent = toExtendAccountEvent(event as ExtendAccountEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "updateAdminEvent":
            processedEvent = toUpdateAdminEvent(event as UpdateAdminEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "updateFeeConfigEvent":
            processedEvent = toUpdateFeeConfigEvent(event as UpdateFeeConfigEvent);
            callback(
              processedEvent as PumpSwapEventHandlers[T],
              slot,
              signature
            );
            break;
          case "withdrawEvent":
            processedEvent = toWithdrawEvent(event as WithdrawEvent);
            callback(processedEvent as PumpSwapEventHandlers[T], slot, signature);
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
