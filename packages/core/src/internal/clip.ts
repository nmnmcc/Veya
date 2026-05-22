import * as Duration from "effect/Duration";
import type * as Clip from "../Clip";
import type * as Timing from "../Timing";
import {
  copyWith,
  hasProperty,
  isRecord,
  setIfDefined,
  PipeableProto,
} from "./common";
import * as timing from "./timing";
import { ClipTypeId } from "./typeIds";

/** @internal */
export const TypeId = ClipTypeId;

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

const CommonProto = {
  [TypeId]: TypeId,
  ...PipeableProto,
};

const baseToJSON = (self: Clip.Base<string>): Record<string, unknown> => {
  const json: Record<string, unknown> = {
    _id: "Clip",
    _tag: self._tag,
  };
  setIfDefined(json, "id", self.id);
  setIfDefined(json, "in", self["in"]?.toJSON());
  setIfDefined(json, "out", self.out?.toJSON());
  setIfDefined(json, "duration", self.duration?.toString());
  setIfDefined(json, "metadata", self.metadata);
  return json;
};

/** @internal */
export const sourceToJSON = (source: Clip.MediaSource): unknown => {
  if (typeof source === "string") {
    return source;
  }
  if (source instanceof URL) {
    return source.toString();
  }
  if (source instanceof Uint8Array) {
    return {
      _tag: "Uint8Array",
      byteLength: source.byteLength,
    };
  }
  return {
    _tag: "Stream",
  };
};

const GapProto = {
  ...CommonProto,
  _tag: "Gap",
  toJSON(this: Clip.Gap) {
    return baseToJSON(this);
  },
  toString(this: Clip.Gap) {
    return `Gap(${JSON.stringify(this.toJSON())})`;
  },
};

const mediaProto = <Self extends Clip.Media>(
  definition: Clip.MediaDefinition<string, Self>,
) => ({
  ...CommonProto,
  _tag: definition.tag,
  toJSON(this: Self) {
    const json = baseToJSON(this);
    return definition.toJSON?.(this, json) ?? json;
  },
  toString(this: Self) {
    return (
      definition.toString?.(this) ??
      `${definition.tag}(${JSON.stringify(this.toJSON())})`
    );
  },
});

const hasDurationObjectKey = (
  input: Readonly<Record<PropertyKey, unknown>>,
): boolean => durationObjectKeys.some((key) => key in input);

const isGapOptions = (input: unknown): input is Clip.GapOptions => {
  if (!isRecord(input) || Duration.isDuration(input) || Array.isArray(input)) {
    return false;
  }
  if (timing.hasTimingKey(input) || "id" in input || "metadata" in input) {
    return true;
  }
  return !hasDurationObjectKey(input);
};

const assignDefined = (
  self: Record<PropertyKey, unknown>,
  fields: object,
): void => {
  const record = fields as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(fields)) {
    setIfDefined(self, key, record[key]);
  }
};

const assignBase = (
  self: Record<PropertyKey, unknown>,
  options: Clip.BaseOptions,
): void => {
  const normalizedTiming = timing.make(options);
  setIfDefined(self, "id", options.id);
  setIfDefined(self, "in", normalizedTiming["in"]);
  setIfDefined(self, "out", normalizedTiming.out);
  setIfDefined(self, "duration", normalizedTiming.duration);
  setIfDefined(self, "metadata", options.metadata);
};

/** @internal */
export const gap = (input?: Clip.GapInput | undefined): Clip.Gap => {
  if (isGap(input)) {
    return input;
  }
  const options: Clip.GapOptions =
    input === undefined
      ? {}
      : isGapOptions(input)
        ? input
        : { duration: input };
  const self = Object.create(GapProto) as Record<PropertyKey, unknown>;
  assignBase(self, options);
  return self as unknown as Clip.Gap;
};

/** @internal */
export const makeMedia = <
  Tag extends string,
  Fields extends object,
  Self extends Clip.Media<Tag, Fields>,
>(
  definition: Clip.MediaDefinition<Tag, Self>,
  fields: Fields,
  options?: Clip.BaseOptions | undefined,
): Self => {
  if (definition.tag === "Gap") {
    throw new TypeError("Media definitions cannot use the reserved Gap tag.");
  }
  const self = Object.create(mediaProto(definition)) as Record<
    PropertyKey,
    unknown
  >;
  assignBase(self, options ?? {});
  assignDefined(self, fields);
  return self as unknown as Self;
};

/** @internal */
export const withTiming = <A extends Clip.Clip>(
  self: A,
  options: Timing.Options,
): A =>
  copyWith(
    self,
    timing.make(options) as Readonly<Record<PropertyKey, unknown>>,
  );

/** @internal */
export const withDuration = <A extends Clip.Clip>(
  self: A,
  duration: Duration.Input,
): A => copyWith(self, { duration: Duration.fromInputUnsafe(duration) });

/** @internal */
export const withIn = <A extends Clip.Clip>(
  self: A,
  inPoint: Clip.Base<string>["in"],
): A => copyWith(self, { in: inPoint });

/** @internal */
export const withOut = <A extends Clip.Clip>(
  self: A,
  outPoint: Clip.Base<string>["out"],
): A => copyWith(self, { out: outPoint });

/** @internal */
export const withId = <A extends Clip.Clip>(self: A, id: string): A =>
  copyWith(self, { id });

/** @internal */
export const withMetadata = <A extends Clip.Clip>(
  self: A,
  metadata: Readonly<Record<string, unknown>>,
): A => copyWith(self, { metadata });

/** @internal */
export const withProperties = <A extends Clip.Clip, Properties extends object>(
  self: A,
  properties: Properties,
): A & Readonly<Properties> =>
  copyWith(self, properties as Readonly<Record<PropertyKey, unknown>>) as A &
    Readonly<Properties>;

/** @internal */
export const isClip = (input: unknown): input is Clip.Clip =>
  hasProperty(input, TypeId);

/** @internal */
export const isGap = (input: unknown): input is Clip.Gap =>
  isClip(input) && input._tag === "Gap";

/** @internal */
export const isMedia = (input: unknown): input is Clip.Media =>
  isClip(input) && input._tag !== "Gap";

/** @internal */
export const hasTag = <Tag extends string>(
  input: unknown,
  tag: Tag,
): input is Clip.Media<Tag> => isClip(input) && input._tag === tag;
