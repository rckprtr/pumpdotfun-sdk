import { Idl } from "@coral-xyz/anchor";
import IDL_JSON from "./pump-fun.json";

export type PumpFun = typeof IDL_JSON & Idl;
