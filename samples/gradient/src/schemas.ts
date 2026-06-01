import { Schema } from "effect";
import * as Rpc from "effect/unstable/rpc/Rpc";
import * as RpcGroup from "effect/unstable/rpc/RpcGroup";

export const Pixel = Schema.Tuple([Schema.Number, Schema.Number, Schema.Number, Schema.Number]);
export type Pixel = Schema.Schema.Type<typeof Pixel>;

export const Row = Schema.Array(Pixel);
export type Row = Schema.Schema.Type<typeof Row>;

export class GenerateRow extends Rpc.make("GenerateRow", {
  success: Row,
  payload: { frameIndex: Schema.Number },
}) {}

export const GradientRpcs = RpcGroup.make(GenerateRow);
