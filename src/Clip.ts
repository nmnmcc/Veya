/**
 * Primitive timeline clips: gaps, videos, and images.
 *
 * @since 0.1.0
 */
import { dual } from "effect/Function";
import type * as Duration from "effect/Duration";
import type * as Stream from "effect/Stream";
import type { Pipeable } from "effect/Pipeable";
import type * as Anchor from "./Anchor";
import type * as Timing from "./Timing";
import * as internal from "./internal/clip";

/**
 * @category symbols
 * @since 0.1.0
 */
export const TypeId = internal.TypeId;

/**
 * @category symbols
 * @since 0.1.0
 */
export type TypeId = typeof TypeId;

/**
 * @category models
 * @since 0.1.0
 */
export type Clip = Gap | Video | Image;

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
export type MediaSource = string | URL | Uint8Array | Stream.Stream<Uint8Array>;

/**
 * @category models
 * @since 0.1.0
 */
export interface Base<Tag extends string> extends Pipeable {
  readonly [TypeId]: TypeId;
  readonly _tag: Tag;
  readonly id?: string;
  readonly in?: Anchor.Anchor;
  readonly out?: Anchor.Anchor;
  readonly duration?: Duration.Duration;
  readonly metadata?: Readonly<Record<string, unknown>>;
  toJSON(): unknown;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface BaseOptions extends Timing.Options {
  readonly id?: string | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

/**
 * An explicit empty span owned by one track.
 *
 * @category models
 * @since 0.1.0
 */
export interface Gap extends Base<"Gap"> {}

/**
 * @category models
 * @since 0.1.0
 */
export interface GapOptions extends BaseOptions {}

/**
 * @category models
 * @since 0.1.0
 */
export type GapInput = Gap | GapOptions | Duration.Input;

/**
 * @category models
 * @since 0.1.0
 */
export interface Video extends Base<"Video"> {
  readonly source: MediaSource;
  readonly fit?: Fit;
  readonly playback?: Playback;
  readonly speed?: number;
  readonly volume?: number;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface VideoOptions extends BaseOptions {
  readonly fit?: Fit | undefined;
  readonly playback?: Playback | undefined;
  readonly speed?: number | undefined;
  readonly volume?: number | undefined;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface VideoOptionsWithSource extends VideoOptions {
  readonly source: MediaSource;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface Image extends Base<"Image"> {
  readonly source: MediaSource;
  readonly fit?: Fit;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface ImageOptions extends BaseOptions {
  readonly fit?: Fit | undefined;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface ImageOptionsWithSource extends ImageOptions {
  readonly source: MediaSource;
}

/**
 * @category constructors
 * @since 0.1.0
 */
export const gap: (input?: GapInput | undefined) => Gap = internal.gap;

/**
 * @category constructors
 * @since 0.1.0
 */
export const video: {
  (source: MediaSource, options?: VideoOptions | undefined): Video;
  (options: VideoOptionsWithSource): Video;
} = internal.video;

/**
 * @category constructors
 * @since 0.1.0
 */
export const image: {
  (source: MediaSource, options?: ImageOptions | undefined): Image;
  (options: ImageOptionsWithSource): Image;
} = internal.image;

/**
 * @category combinators
 * @since 0.1.0
 */
export const withTiming: {
  (timing: Timing.Options): <A extends Clip>(self: A) => A;
  <A extends Clip>(self: A, timing: Timing.Options): A;
} = dual(2, internal.withTiming);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withDuration: {
  (duration: Duration.Input): <A extends Clip>(self: A) => A;
  <A extends Clip>(self: A, duration: Duration.Input): A;
} = dual(2, internal.withDuration);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withIn: {
  (inPoint: Anchor.Anchor): <A extends Clip>(self: A) => A;
  <A extends Clip>(self: A, inPoint: Anchor.Anchor): A;
} = dual(2, internal.withIn);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withOut: {
  (outPoint: Anchor.Anchor): <A extends Clip>(self: A) => A;
  <A extends Clip>(self: A, outPoint: Anchor.Anchor): A;
} = dual(2, internal.withOut);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withId: {
  (id: string): <A extends Clip>(self: A) => A;
  <A extends Clip>(self: A, id: string): A;
} = dual(2, internal.withId);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withMetadata: {
  (metadata: Readonly<Record<string, unknown>>): <A extends Clip>(self: A) => A;
  <A extends Clip>(self: A, metadata: Readonly<Record<string, unknown>>): A;
} = dual(2, internal.withMetadata);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withFit: {
  (fit: Fit): <A extends Video | Image>(self: A) => A;
  <A extends Video | Image>(self: A, fit: Fit): A;
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
export const isClip: (input: unknown) => input is Clip = internal.isClip;

/**
 * @category guards
 * @since 0.1.0
 */
export const isGap: (input: unknown) => input is Gap = internal.isGap;

/**
 * @category guards
 * @since 0.1.0
 */
export const isVideo: (input: unknown) => input is Video = internal.isVideo;

/**
 * @category guards
 * @since 0.1.0
 */
export const isImage: (input: unknown) => input is Image = internal.isImage;
