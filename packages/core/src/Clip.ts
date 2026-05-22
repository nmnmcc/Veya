/**
 * Primitive timeline clips and extension points for custom media clips.
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
export type Clip = Gap | Media;

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
 * A media clip supplied by a concrete package or user extension.
 *
 * @category models
 * @since 0.1.0
 */
export type Media<
  Tag extends string = string,
  Fields extends object = object,
> = Base<Tag> & Readonly<Fields>;

/**
 * Runtime behavior for a concrete media type.
 *
 * @category models
 * @since 0.1.0
 */
export interface MediaDefinition<
  Tag extends string,
  Self extends Media<Tag> = Media<Tag>,
> {
  readonly tag: Tag;
  readonly toJSON?:
    | ((self: Self, base: Record<string, unknown>) => Record<string, unknown>)
    | undefined;
  readonly toString?: ((self: Self) => string) | undefined;
}

/**
 * @category constructors
 * @since 0.1.0
 */
export const gap: (input?: GapInput | undefined) => Gap = internal.gap;

/**
 * Builds a custom media clip from a media definition and concrete fields.
 *
 * @category constructors
 * @since 0.1.0
 */
export const makeMedia: <
  const Tag extends string,
  Fields extends object,
  Self extends Media<Tag, Fields> = Media<Tag, Fields>,
>(
  definition: MediaDefinition<Tag, Self>,
  fields: Fields,
  options?: BaseOptions | undefined,
) => Self = internal.makeMedia;

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
export const withProperties: {
  <Properties extends object>(
    properties: Properties,
  ): <A extends Clip>(self: A) => A & Readonly<Properties>;
  <A extends Clip, Properties extends object>(
    self: A,
    properties: Properties,
  ): A & Readonly<Properties>;
} = dual(2, internal.withProperties);

/**
 * @category serialization
 * @since 0.1.0
 */
export const sourceToJSON: (source: MediaSource) => unknown =
  internal.sourceToJSON;

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
export const isMedia: (input: unknown) => input is Media = internal.isMedia;

/**
 * @category guards
 * @since 0.1.0
 */
export const hasTag: <const Tag extends string>(
  input: unknown,
  tag: Tag,
) => input is Media<Tag> = internal.hasTag;
