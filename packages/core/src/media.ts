import { Schema } from "effect";

const NonNegativeInt = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));

const PositiveInt = NonNegativeInt.check(Schema.isGreaterThan(0));

export const FrameCountSchema = PositiveInt.pipe(Schema.annotate({ identifier: "FrameCount" }));
export type FrameCount = typeof FrameCountSchema.Type;

export const SizeSchema = Schema.Tuple([PositiveInt, PositiveInt]).pipe(Schema.annotate({ identifier: "Size" }));
export type Size = (typeof SizeSchema)["Type"];

export const PositionSchema = Schema.Tuple([NonNegativeInt, NonNegativeInt]).pipe(
  Schema.annotate({ identifier: "Position" }),
);
export type Position = typeof PositionSchema.Type;

export type RGBA = readonly [red: number, green: number, blue: number, alpha: number];

export type Bitmap = readonly (readonly RGBA[])[];

export const SampleCountSchema = PositiveInt.pipe(Schema.annotate({ identifier: "SampleCount" }));
export type SampleCount = typeof SampleCountSchema.Type;

export const SamplerateSchema = PositiveInt.pipe(Schema.annotate({ identifier: "Samplerate" }));
export type Samplerate = typeof SamplerateSchema.Type;

export const ChannelCountSchema = PositiveInt.pipe(Schema.annotate({ identifier: "ChannelCount" }));
export type ChannelCount = typeof ChannelCountSchema.Type;

export interface AudioBuffer {
  readonly samplerate: Samplerate;
  readonly channels: readonly Float32Array[];
}

export type AudioChunk = AudioBuffer;
