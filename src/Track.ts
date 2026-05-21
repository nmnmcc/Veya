/**
 * Timeline tracks. A track is a layer of clips evaluated from left to right.
 *
 * @since 0.1.0
 */
import { dual } from "effect/Function";
import type { Pipeable } from "effect/Pipeable";
import type * as Clip from "./Clip";
import type * as Sequence from "./Sequence";
import * as internal from "./internal/track";

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
export type Element = Clip.Clip | Sequence.Sequence;

/**
 * @category models
 * @since 0.1.0
 */
export interface Track<
  Items extends readonly Element[] = readonly Element[],
> extends Pipeable {
  readonly [TypeId]: TypeId;
  readonly items: Items;
  readonly name?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  toJSON(): unknown;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface Options<
  Items extends readonly Element[] = readonly Element[],
> {
  readonly items: Items;
  readonly name?: string | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

/**
 * @category models
 * @since 0.1.0
 */
export type Input<Items extends readonly Element[] = readonly Element[]> =
  | Track
  | Options<Items>
  | Items;

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: {
  <const Items extends readonly Element[]>(items: Items): Track<Items>;
  <const Items extends readonly Element[]>(
    options: Options<Items>,
  ): Track<Items>;
  <Items extends readonly Element[]>(track: Track<Items>): Track<Items>;
} = internal.make;

/**
 * @category combinators
 * @since 0.1.0
 */
export const append: {
  (
    item: Element,
  ): <Items extends readonly Element[]>(
    self: Track<Items>,
  ) => Track<readonly [...Items, Element]>;
  <Items extends readonly Element[]>(
    self: Track<Items>,
    item: Element,
  ): Track<readonly [...Items, Element]>;
} = dual(2, internal.append);

/**
 * @category combinators
 * @since 0.1.0
 */
export const prepend: {
  (
    item: Element,
  ): <Items extends readonly Element[]>(
    self: Track<Items>,
  ) => Track<readonly [Element, ...Items]>;
  <Items extends readonly Element[]>(
    self: Track<Items>,
    item: Element,
  ): Track<readonly [Element, ...Items]>;
} = dual(2, internal.prepend);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withName: {
  (
    name: string,
  ): <Items extends readonly Element[]>(self: Track<Items>) => Track<Items>;
  <Items extends readonly Element[]>(
    self: Track<Items>,
    name: string,
  ): Track<Items>;
} = dual(2, internal.withName);

/**
 * @category combinators
 * @since 0.1.0
 */
export const withMetadata: {
  (
    metadata: Readonly<Record<string, unknown>>,
  ): <Items extends readonly Element[]>(self: Track<Items>) => Track<Items>;
  <Items extends readonly Element[]>(
    self: Track<Items>,
    metadata: Readonly<Record<string, unknown>>,
  ): Track<Items>;
} = dual(2, internal.withMetadata);

/**
 * @category guards
 * @since 0.1.0
 */
export const isTrack: (input: unknown) => input is Track = internal.isTrack;
