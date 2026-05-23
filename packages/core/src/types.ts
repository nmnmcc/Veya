import { Schema } from "effect";

const NonNegativeInt = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));

const PositiveInt = NonNegativeInt.check(Schema.isGreaterThan(0));

export const FrameCountSchema = PositiveInt.pipe(
  Schema.brand("@veya/core/Timeline/FrameCount"),
  Schema.annotate({ identifier: "FrameCount" }),
);
export type FrameCount = typeof FrameCountSchema.Type;
export const FrameCount = FrameCountSchema.make;

export const SizeSchema = Schema.Tuple([PositiveInt, PositiveInt]).pipe(
  Schema.brand("@veya/core/Timeline/Size"),
  Schema.annotate({ identifier: "Size" }),
);
export type Size = (typeof SizeSchema)["Type"];
export const Size = SizeSchema.make;

export const PositionSchema = Schema.Tuple([NonNegativeInt, NonNegativeInt]).pipe(
  Schema.brand("@veya/core/Timeline/Position"),
  Schema.annotate({ identifier: "Position" }),
);
export type Position = typeof PositionSchema.Type;
export const Position = PositionSchema.make;

export type Bitmap = readonly (readonly { R: number; G: number; B: number; A: number }[])[];

export const SampleCountSchema = PositiveInt.pipe(
  Schema.brand("@veya/core/Timeline/SampleCount"),
  Schema.annotate({ identifier: "SampleCount" }),
);
export type SampleCount = typeof SampleCountSchema.Type;
export const SampleCount = SampleCountSchema.make;

export const SampleRateSchema = PositiveInt.pipe(
  Schema.brand("@veya/core/Timeline/SampleRate"),
  Schema.annotate({ identifier: "SampleRate" }),
);
export type SampleRate = typeof SampleRateSchema.Type;
export const SampleRate = SampleRateSchema.make;

export const ChannelCountSchema = PositiveInt.pipe(
  Schema.brand("@veya/core/Timeline/ChannelCount"),
  Schema.annotate({ identifier: "ChannelCount" }),
);
export type ChannelCount = typeof ChannelCountSchema.Type;
export const ChannelCount = ChannelCountSchema.make;

export interface AudioBuffer {
  readonly sampleRate: SampleRate;
  readonly channels: readonly Float32Array[];
}
