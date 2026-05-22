/**
 * Shared timing options for sequences, gaps, and media clips.
 *
 * @since 0.1.0
 */
import type * as Duration from "effect/Duration";
import type * as Anchor from "./Anchor";
import * as internal from "./internal/timing";

/**
 * @category models
 * @since 0.1.0
 */
export interface Timing {
  readonly in?: Anchor.Anchor;
  readonly out?: Anchor.Anchor;
  readonly duration?: Duration.Duration;
}

/**
 * @category models
 * @since 0.1.0
 */
export interface Options {
  readonly in?: Anchor.Anchor | undefined;
  readonly out?: Anchor.Anchor | undefined;
  readonly duration?: Duration.Input | undefined;
}

/**
 * @category models
 * @since 0.1.0
 */
export type Input = Options | Duration.Input;

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: (input?: Input | undefined) => Timing = internal.make;
