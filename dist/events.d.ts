import { CompleteEvent, CreateEvent, SetParamsEvent, TradeEvent } from "./types";
export declare function toCreateEvent(event: CreateEvent): CreateEvent;
export declare function toCompleteEvent(event: CompleteEvent): CompleteEvent;
export declare function toTradeEvent(event: TradeEvent): TradeEvent;
export declare function toSetParamsEvent(event: SetParamsEvent): SetParamsEvent;
