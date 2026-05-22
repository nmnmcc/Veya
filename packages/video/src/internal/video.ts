import { Clip } from "@veya/core";
import type * as Video from "../Video";

const isRecord = (
  input: unknown,
): input is Readonly<Record<PropertyKey, unknown>> =>
  typeof input === "object" && input !== null;

const setIfDefined = (
  target: Record<PropertyKey, unknown>,
  key: PropertyKey,
  value: unknown,
): void => {
  if (value !== undefined) {
    target[key] = value;
  }
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

const definition: Clip.MediaDefinition<"Video", Video.Video> = {
  tag: "Video",
  toJSON(self, json) {
    json["source"] = Clip.sourceToJSON(self.source);
    setIfDefined(json, "fit", self.fit);
    setIfDefined(json, "playback", self.playback);
    setIfDefined(json, "speed", self.speed);
    setIfDefined(json, "volume", self.volume);
    return json;
  },
};

/** @internal */
export const make = (
  sourceOrOptions: Clip.MediaSource | Video.OptionsWithSource,
  options?: Video.Options | undefined,
): Video.Video => {
  const normalized = optionsFromSource<Video.OptionsWithSource>(
    sourceOrOptions,
    options,
  );
  const fields: {
    readonly source: Clip.MediaSource;
    fit?: Video.Fit;
    playback?: Video.Playback;
    speed?: number;
    volume?: number;
  } = {
    source: normalized.source,
  };
  const fieldRecord = fields as Record<PropertyKey, unknown>;
  setIfDefined(fieldRecord, "fit", normalized.options.fit);
  setIfDefined(fieldRecord, "playback", normalized.options.playback);
  setIfDefined(fieldRecord, "speed", normalized.options.speed);
  setIfDefined(fieldRecord, "volume", normalized.options.volume);
  return Clip.makeMedia(definition, fields, normalized.options);
};

/** @internal */
export const withFit = (self: Video.Video, fit: Video.Fit): Video.Video =>
  Clip.withProperties(self, { fit });

/** @internal */
export const withPlayback = (
  self: Video.Video,
  playback: Video.Playback,
): Video.Video => Clip.withProperties(self, { playback });

/** @internal */
export const withSpeed = (self: Video.Video, speed: number): Video.Video =>
  Clip.withProperties(self, { speed });

/** @internal */
export const withVolume = (self: Video.Video, volume: number): Video.Video =>
  Clip.withProperties(self, { volume });

/** @internal */
export const isVideo = (input: unknown): input is Video.Video =>
  Clip.hasTag(input, "Video");
