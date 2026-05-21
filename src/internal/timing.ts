import * as Duration from "effect/Duration";
import type * as Timing from "../Timing";
import { isRecord } from "./common";

const timingKeys = ["in", "out", "duration"] as const;
const durationObjectKeys = [
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
  "microseconds",
  "nanoseconds",
] as const;

const hasDurationObjectKey = (
  input: Readonly<Record<PropertyKey, unknown>>,
): boolean => durationObjectKeys.some((key) => key in input);

const isOptionsRecord = (input: unknown): input is Timing.Options =>
  isRecord(input) &&
  !Array.isArray(input) &&
  !Duration.isDuration(input) &&
  !hasDurationObjectKey(input);

/** @internal */
export const hasTimingKey = (input: unknown): input is Timing.Options =>
  isRecord(input) && timingKeys.some((key) => key in input);

/** @internal */
export const make = (input?: Timing.Input | undefined): Timing.Timing => {
  if (input === undefined) {
    return {};
  }
  if (hasTimingKey(input) || isOptionsRecord(input)) {
    return fromOptions(input);
  }
  return {
    duration: Duration.fromInputUnsafe(input),
  };
};

/** @internal */
export const fromOptions = (options: Timing.Options): Timing.Timing => {
  const timing: Record<PropertyKey, unknown> = {};
  if (options["in"] !== undefined) {
    timing["in"] = options["in"];
  }
  if (options.out !== undefined) {
    timing["out"] = options.out;
  }
  if (options.duration !== undefined) {
    timing["duration"] = Duration.fromInputUnsafe(options.duration);
  }
  return timing as Timing.Timing;
};
