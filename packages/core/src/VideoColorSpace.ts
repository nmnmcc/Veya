import { Schema } from "effect";

export namespace VideoColorSpace {
  /** Runtime schema for supported video color spaces. */
  export const VideoColorSpace = Schema.Literals(["srgb", "display-p3"]);
  /** Supported video color space name. */
  export type VideoColorSpace = typeof VideoColorSpace.Type;

  /** Default color space used when no color space is provided. */
  export const Default = "srgb" as const satisfies VideoColorSpace;
}
