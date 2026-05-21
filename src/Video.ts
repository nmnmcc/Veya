/**
 * Video clips.
 *
 * @since 0.1.0
 */
import type * as Clip from "./Clip";
import * as internal from "./internal/clip";

/**
 * @category models
 * @since 0.1.0
 */
export type Video = Clip.Video;

/**
 * @category models
 * @since 0.1.0
 */
export type Options = Clip.VideoOptions;

/**
 * @category models
 * @since 0.1.0
 */
export type OptionsWithSource = Clip.VideoOptionsWithSource;

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: {
  (source: Clip.MediaSource, options?: Options | undefined): Video;
  (options: OptionsWithSource): Video;
} = internal.video;

/**
 * @category guards
 * @since 0.1.0
 */
export const isVideo: (input: unknown) => input is Video = internal.isVideo;

export {
  withDuration,
  withFit,
  withIn,
  withId,
  withMetadata,
  withPlayback,
  withSpeed,
  withTiming,
  withOut,
  withVolume,
} from "./Clip";
