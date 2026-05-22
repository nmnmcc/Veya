/**
 * Time anchors used to place clips on a timeline.
 *
 * @since 0.1.0
 */
import type * as Duration from "effect/Duration";
import type { Pipeable } from "effect/Pipeable";
import * as internal from "./internal/anchor";

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
export type Anchor = Frame | Time;

/**
 * @category models
 * @since 0.1.0
 */
export interface Frame extends Pipeable {
  readonly [TypeId]: TypeId;
  readonly _tag: "Frame";
  readonly frame: number;
  toJSON(): unknown;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface Time extends Pipeable {
  readonly [TypeId]: TypeId;
  readonly _tag: "Time";
  readonly time: Duration.Duration;
  toJSON(): unknown;
}

/**
 * @category constructors
 * @since 0.1.0
 */
export const frame: (frame: number) => Frame = internal.frame;

/**
 * @category constructors
 * @since 0.1.0
 */
export const time: (time: Duration.Input) => Time = internal.time;

/**
 * @category guards
 * @since 0.1.0
 */
export const isAnchor: (input: unknown) => input is Anchor = internal.isAnchor;

/**
 * @category guards
 * @since 0.1.0
 */
export const isFrame: (input: unknown) => input is Frame = internal.isFrame;

/**
 * @category guards
 * @since 0.1.0
 */
export const isTime: (input: unknown) => input is Time = internal.isTime;
