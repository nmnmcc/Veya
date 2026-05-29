import { Schema } from "effect";

export namespace VideoColorSpace {
  export type VideoColorSpace = typeof VideoColorSpace.Type;

  /** Runtime schema for supported video color spaces. */
  export const VideoColorSpace = Schema.Literals(["srgb", "display-p3"]);
  /** Default color space used when no color space is provided. */
  export const Default = "srgb" as const satisfies VideoColorSpace;
}
