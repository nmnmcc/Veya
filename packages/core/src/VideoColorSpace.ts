import { Schema } from "effect";

export namespace VideoColorSpace {
  export const VideoLinearColorSpace = Schema.Literals(["srgb-linear", "display-p3-linear"]);
  export type VideoLinearColorSpace = typeof VideoLinearColorSpace.Type;

  export const VideoColorSpace = Schema.Union([VideoLinearColorSpace, Schema.Literals(["srgb", "display-p3"])]);
  export type VideoColorSpace = typeof VideoColorSpace.Type;

  export const Default = "srgb" as const satisfies VideoColorSpace;
}
