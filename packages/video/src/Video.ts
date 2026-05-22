/**
 * Video clips.
 *
 * @since 0.1.0
 */
import { dual } from "effect/Function";
import { Clip } from "@veya/core";
import * as internal from "./internal/video";

/**
 * @category models
 * @since 0.1.0
 */
export type Fit = "contain" | "cover" | "fill" | "none";

/**
 * @category models
 * @since 0.1.0
 */
export type Playback = "clip" | "loop" | "freeze";

/**
 * @category models
 * @since 0.1.0
 */
export type Video = Clip.Media<
  "Video",
  {
    readonly source: Clip.MediaSource;
    readonly fit?: Fit;
    readonly playback?: Playback;
    readonly speed?: number;
    readonly volume?: number;
  }
>;

/**
 * @category models
 * @since 0.1.0
 */
export interface Options extends Clip.BaseOptions {
  readonly fit?: Fit | undefined;
  readonly playback?: Playback | undefined;
  readonly speed?: number | undefined;
  readonly volume?: number | undefined;
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
  (source: Clip.MediaSource, options?: Options | undefined): Video;
  (options: OptionsWithSource): Video;
} = internal.make;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withFit: {
  (fit: Fit): (self: Video) => Video;
  (self: Video, fit: Fit): Video;
} = dual(2, internal.withFit);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withPlayback: {
  (playback: Playback): (self: Video) => Video;
  (self: Video, playback: Playback): Video;
} = dual(2, internal.withPlayback);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withSpeed: {
  (speed: number): (self: Video) => Video;
  (self: Video, speed: number): Video;
} = dual(2, internal.withSpeed);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withVolume: {
  (volume: number): (self: Video) => Video;
  (self: Video, volume: number): Video;
} = dual(2, internal.withVolume);

/**
 * @category guards
 * @since 0.1.0
 */
export const isVideo: (input: unknown) => input is Video = internal.isVideo;

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
