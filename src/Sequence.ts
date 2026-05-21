/**
 * Sequences are composable timeline containers. A sequence can be the root
 * video or a clip nested inside another track.
 *
 * @since 0.1.0
 */
import { dual } from "effect/Function";
import type * as Duration from "effect/Duration";
import type { Pipeable } from "effect/Pipeable";
import type * as Track from "./Track";
import * as internal from "./internal/sequence";

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
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * @category models
 * @since 0.1.0
 */
export type SizeInput = Size | readonly [width: number, height: number];

/**
 * @category type-level
 * @since 0.1.0
 */
export type NormalizeTracks<Tracks extends readonly Track.Input[]> = {
  readonly [K in keyof Tracks]: Track.Track;
};

/**
 * @category models
 * @since 0.1.0
 */
export interface Sequence<
  Tracks extends readonly Track.Track[] = readonly Track.Track[],
> extends Pipeable {
  readonly [TypeId]: TypeId;
  readonly _tag: "Sequence";
  readonly tracks: Tracks;
  readonly name?: string;
  readonly size?: Size;
  readonly framerate?: number;
  readonly duration?: Duration.Duration;
  readonly metadata?: Readonly<Record<string, unknown>>;
  toJSON(): unknown;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface Options<
  Tracks extends readonly Track.Input[] = readonly Track.Input[],
> {
  readonly tracks: Tracks;
  readonly name?: string | undefined;
  readonly size?: SizeInput | undefined;
  readonly framerate?: number | undefined;
  readonly duration?: Duration.Input | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: {
  <const Tracks extends readonly Track.Input[]>(
    options: Options<Tracks>,
  ): Sequence<NormalizeTracks<Tracks>>;
  <Tracks extends readonly Track.Track[]>(
    sequence: Sequence<Tracks>,
  ): Sequence<Tracks>;
} = internal.make;

/**
 * @category combinators
 * @since 0.1.0
 */
export const addTrack: {
  (
    track: Track.Input,
  ): <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
  ) => Sequence<readonly [...Tracks, Track.Track]>;
  <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
    track: Track.Input,
  ): Sequence<readonly [...Tracks, Track.Track]>;
} = dual(2, internal.addTrack);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withTracks: {
  <const Tracks extends readonly Track.Input[]>(
    tracks: Tracks,
  ): (self: Sequence) => Sequence<NormalizeTracks<Tracks>>;
  <const Tracks extends readonly Track.Input[]>(
    self: Sequence,
    tracks: Tracks,
  ): Sequence<NormalizeTracks<Tracks>>;
} = dual(2, internal.withTracks);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withSize: {
  (
    size: SizeInput,
  ): <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
  ) => Sequence<Tracks>;
  <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
    size: SizeInput,
  ): Sequence<Tracks>;
} = dual(2, internal.withSize);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withFramerate: {
  (
    framerate: number,
  ): <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
  ) => Sequence<Tracks>;
  <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
    framerate: number,
  ): Sequence<Tracks>;
} = dual(2, internal.withFramerate);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withDuration: {
  (
    duration: Duration.Input,
  ): <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
  ) => Sequence<Tracks>;
  <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
    duration: Duration.Input,
  ): Sequence<Tracks>;
} = dual(2, internal.withDuration);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withName: {
  (
    name: string,
  ): <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
  ) => Sequence<Tracks>;
  <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
    name: string,
  ): Sequence<Tracks>;
} = dual(2, internal.withName);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withMetadata: {
  (
    metadata: Readonly<Record<string, unknown>>,
  ): <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
  ) => Sequence<Tracks>;
  <Tracks extends readonly Track.Track[]>(
    self: Sequence<Tracks>,
    metadata: Readonly<Record<string, unknown>>,
  ): Sequence<Tracks>;
} = dual(2, internal.withMetadata);

/**
 * @category guards
 * @since 0.1.0
 */
export const isSequence: (input: unknown) => input is Sequence =
  internal.isSequence;
