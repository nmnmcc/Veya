import { pipeArguments } from "effect/Pipeable";

/** @internal */
export const PipeableProto = {
  pipe(this: unknown) {
    return pipeArguments(this, arguments);
  },
};

/** @internal */
export const hasProperty = <K extends PropertyKey>(
  input: unknown,
  property: K,
): input is { readonly [P in K]: unknown } =>
  (typeof input === "object" || typeof input === "function") &&
  input !== null &&
  property in input;

/** @internal */
export const isRecord = (
  input: unknown,
): input is Readonly<Record<PropertyKey, unknown>> =>
  typeof input === "object" && input !== null;

/** @internal */
export const copyWith = <A extends object>(
  self: A,
  patch: Readonly<Record<PropertyKey, unknown>>,
): A => {
  const next = Object.assign(
    Object.create(Object.getPrototypeOf(self)),
    self,
  ) as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(patch)) {
    const value = patch[key];
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next as A;
};

/** @internal */
export const setIfDefined = (
  target: Record<PropertyKey, unknown>,
  key: PropertyKey,
  value: unknown,
): void => {
  if (value !== undefined) {
    target[key] = value;
  }
};
