/**
 * Empty timeline slots.
 *
 * @since 0.1.0
 */
import type * as Clip from "./Clip";
import * as internal from "./internal/clip";

/**
 * @category models
 * @since 0.1.0
 */
export type Slot = Clip.Slot;

/**
 * @category models
 * @since 0.1.0
 */
export type Options = Clip.SlotOptions;

/**
 * @category models
 * @since 0.1.0
 */
export type Input = Clip.SlotInput;

/**
 * @category constructors
 * @since 0.1.0
 */
export const make: (input?: Input | undefined) => Slot = internal.slot;

/**
 * @category guards
 * @since 0.1.0
 */
export const isSlot: (input: unknown) => input is Slot = internal.isSlot;

export {
  withDuration,
  withIn,
  withId,
  withMetadata,
  withTiming,
  withOut,
} from "./Clip";
