import { Schema } from "effect";

export namespace VideoColorSpace {
  export const VideoColorSpace = Schema.Literals(["srgb", "display-p3"]);
  export type VideoColorSpace = typeof VideoColorSpace.Type;

  export const Default = "srgb" as const satisfies VideoColorSpace;
}
