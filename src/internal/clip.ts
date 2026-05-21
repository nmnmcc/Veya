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

const sourceToJSON = (source: Clip.MediaSource): unknown => {
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

const SlotProto = {
  ...CommonProto,
  _tag: "Slot",
  toJSON(this: Clip.Slot) {
    return baseToJSON(this);
  },
  toString(this: Clip.Slot) {
    return `Slot(${JSON.stringify(this.toJSON())})`;
  },
};

const VideoProto = {
  ...CommonProto,
  _tag: "Video",
  toJSON(this: Clip.Video) {
    const json = baseToJSON(this);
    json["source"] = sourceToJSON(this.source);
    setIfDefined(json, "fit", this.fit);
    setIfDefined(json, "playback", this.playback);
    setIfDefined(json, "speed", this.speed);
    setIfDefined(json, "volume", this.volume);
    return json;
  },
  toString(this: Clip.Video) {
    return `Video(${JSON.stringify(this.toJSON())})`;
  },
};

const ImageProto = {
  ...CommonProto,
  _tag: "Image",
  toJSON(this: Clip.Image) {
    const json = baseToJSON(this);
    json["source"] = sourceToJSON(this.source);
    setIfDefined(json, "fit", this.fit);
    return json;
  },
  toString(this: Clip.Image) {
    return `Image(${JSON.stringify(this.toJSON())})`;
  },
};

const hasDurationObjectKey = (
  input: Readonly<Record<PropertyKey, unknown>>,
): boolean => durationObjectKeys.some((key) => key in input);

const isSlotOptions = (input: unknown): input is Clip.SlotOptions => {
  if (!isRecord(input) || Duration.isDuration(input) || Array.isArray(input)) {
    return false;
  }
  if (timing.hasTimingKey(input) || "id" in input || "metadata" in input) {
    return true;
  }
  return !hasDurationObjectKey(input);
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

const optionsFromSource = <
  Options extends { readonly source: Clip.MediaSource },
>(
  sourceOrOptions: Clip.MediaSource | Options,
  options: Omit<Options, "source"> | undefined,
): {
  readonly source: Clip.MediaSource;
  readonly options: Omit<Options, "source">;
} => {
  if (isRecord(sourceOrOptions) && "source" in sourceOrOptions) {
    const { source, ...rest } = sourceOrOptions;
    return {
      source: source as Clip.MediaSource,
      options: rest as Omit<Options, "source">,
    };
  }
  return {
    source: sourceOrOptions,
    options: options ?? ({} as Omit<Options, "source">),
  };
};

/** @internal */
export const slot = (input?: Clip.SlotInput | undefined): Clip.Slot => {
  if (isSlot(input)) {
    return input;
  }
  const options: Clip.SlotOptions =
    input === undefined
      ? {}
      : isSlotOptions(input)
        ? input
        : { duration: input };
  const self = Object.create(SlotProto) as Record<PropertyKey, unknown>;
  assignBase(self, options);
  return self as unknown as Clip.Slot;
};

/** @internal */
export const video = (
  sourceOrOptions: Clip.MediaSource | Clip.VideoOptionsWithSource,
  options?: Clip.VideoOptions | undefined,
): Clip.Video => {
  const normalized = optionsFromSource<Clip.VideoOptionsWithSource>(
    sourceOrOptions,
    options,
  );
  const self = Object.create(VideoProto) as Record<PropertyKey, unknown>;
  assignBase(self, normalized.options);
  self["source"] = normalized.source;
  setIfDefined(self, "fit", normalized.options.fit);
  setIfDefined(self, "playback", normalized.options.playback);
  setIfDefined(self, "speed", normalized.options.speed);
  setIfDefined(self, "volume", normalized.options.volume);
  return self as unknown as Clip.Video;
};

/** @internal */
export const image = (
  sourceOrOptions: Clip.MediaSource | Clip.ImageOptionsWithSource,
  options?: Clip.ImageOptions | undefined,
): Clip.Image => {
  const normalized = optionsFromSource<Clip.ImageOptionsWithSource>(
    sourceOrOptions,
    options,
  );
  const self = Object.create(ImageProto) as Record<PropertyKey, unknown>;
  assignBase(self, normalized.options);
  self["source"] = normalized.source;
  setIfDefined(self, "fit", normalized.options.fit);
  return self as unknown as Clip.Image;
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
export const withFit = <A extends Clip.Video | Clip.Image>(
  self: A,
  fit: Clip.Fit,
): A => copyWith(self, { fit });

/** @internal */
export const withPlayback = (
  self: Clip.Video,
  playback: Clip.Playback,
): Clip.Video => copyWith(self, { playback });

/** @internal */
export const withSpeed = (self: Clip.Video, speed: number): Clip.Video =>
  copyWith(self, { speed });

/** @internal */
export const withVolume = (self: Clip.Video, volume: number): Clip.Video =>
  copyWith(self, { volume });

/** @internal */
export const isClip = (input: unknown): input is Clip.Clip =>
  hasProperty(input, TypeId);

/** @internal */
export const isSlot = (input: unknown): input is Clip.Slot =>
  isClip(input) && input._tag === "Slot";

/** @internal */
export const isVideo = (input: unknown): input is Clip.Video =>
  isClip(input) && input._tag === "Video";

/** @internal */
export const isImage = (input: unknown): input is Clip.Image =>
  isClip(input) && input._tag === "Image";
