/**
 * Empty timeline gaps.
 *
 * @since 0.1.0
 */
import type * as Clip from "./Clip";
import * as internal from "./internal/clip";

/**
 * @category models
 * @since 0.1.0
 */
export type Gap = Clip.Gap;

/**
 * @category models
 * @since 0.1.0
 */
export type Options = Clip.GapOptions;

/**
 * @category models
 * @since 0.1.0
 */
export type Input = Clip.GapInput;

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: (input?: Input | undefined) => Gap = internal.gap;

/**
 * @category guards
 * @since 0.1.0
 */
export const isGap: (input: unknown) => input is Gap = internal.isGap;

export {
  withDuration,
  withIn,
  withId,
  withMetadata,
  withTiming,
  withOut,
} from "./Clip";
