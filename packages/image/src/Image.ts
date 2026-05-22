/**
 * Image clips.
 *
 * @since 0.1.0
 */
import { dual } from "effect/Function";
import { Clip } from "@veya/core";
import * as internal from "./internal/image";

/**
 * @category models
 * @since 0.1.0
 */
export type Fit = "contain" | "cover" | "fill" | "none";

/**
 * @category models
 * @since 0.1.0
 */
export type Image = Clip.Media<
  "Image",
  {
    readonly source: Clip.MediaSource;
    readonly fit?: Fit;
  }
>;

/**
 * @category models
 * @since 0.1.0
 */
export interface Options extends Clip.BaseOptions {
  readonly fit?: Fit | undefined;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface OptionsWithSource extends Options {
  readonly source: Clip.MediaSource;
}

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: {
  (source: Clip.MediaSource, options?: Options | undefined): Image;
  (options: OptionsWithSource): Image;
} = internal.make;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withFit: {
  (fit: Fit): (self: Image) => Image;
  (self: Image, fit: Fit): Image;
} = dual(2, internal.withFit);

/**
 * @category guards
 * @since 0.1.0
 */
export const isImage: (input: unknown) => input is Image = internal.isImage;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withTiming: typeof Clip.withTiming = Clip.withTiming;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withDuration: typeof Clip.withDuration = Clip.withDuration;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withIn: typeof Clip.withIn = Clip.withIn;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withOut: typeof Clip.withOut = Clip.withOut;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withId: typeof Clip.withId = Clip.withId;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withMetadata: typeof Clip.withMetadata = Clip.withMetadata;
