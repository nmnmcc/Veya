/**
 * Image clips.
 *
 * @since 0.1.0
 */
import type * as Clip from "./Clip";
import * as internal from "./internal/clip";

/**
 * @category models
 * @since 0.1.0
 */
export type Image = Clip.Image;

/**
 * @category models
 * @since 0.1.0
 */
export type Options = Clip.ImageOptions;

/**
 * @category models
 * @since 0.1.0
 */
export type OptionsWithSource = Clip.ImageOptionsWithSource;

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: {
  (source: Clip.MediaSource, options?: Options | undefined): Image;
  (options: OptionsWithSource): Image;
} = internal.image;

/**
 * @category guards
 * @since 0.1.0
 */
export const isImage: (input: unknown) => input is Image = internal.isImage;

export {
  withDuration,
  withFit,
  withIn,
  withId,
  withMetadata,
  withTiming,
  withOut,
} from "./Clip";
