import * as Duration from "effect/Duration";
import type * as Sequence from "../Sequence";
import type * as Track from "../Track";
import { copyWith, hasProperty, setIfDefined, PipeableProto } from "./common";
import * as track from "./track";
import { SequenceTypeId } from "./typeIds";

/** @internal */
export const TypeId = SequenceTypeId;

const Proto = {
  [TypeId]: TypeId,
  _tag: "Sequence",
  ...PipeableProto,
  toJSON(this: Sequence.Sequence) {
    const json: Record<string, unknown> = {
      _id: "Sequence",
      tracks: this.tracks.map((item) => item.toJSON()),
    };
    setIfDefined(json, "name", this.name);
    setIfDefined(json, "size", this.size);
    setIfDefined(json, "framerate", this.framerate);
    setIfDefined(json, "duration", this.duration?.toString());
    setIfDefined(json, "metadata", this.metadata);
    return json;
  },
  toString(this: Sequence.Sequence) {
    return `Sequence(${JSON.stringify(this.toJSON())})`;
  },
};

const normalizeSize = (size: Sequence.SizeInput): Sequence.Size =>
  Array.isArray(size)
    ? { width: size[0], height: size[1] }
    : (size as Sequence.Size);

const normalizeTracks = <Tracks extends readonly Track.Input[]>(
  tracks: Tracks,
): Sequence.NormalizeTracks<Tracks> =>
  tracks.map(track.make) as Sequence.NormalizeTracks<Tracks>;

/** @internal */
export const make = (
  input: Sequence.Options | Sequence.Sequence,
): Sequence.Sequence => {
  if (isSequence(input)) {
    return input;
  }
  const self = Object.create(Proto) as Record<PropertyKey, unknown>;
  self["tracks"] = normalizeTracks(input.tracks);
  setIfDefined(self, "name", input.name);
  if (input.size !== undefined) {
    self["size"] = normalizeSize(input.size);
  }
  setIfDefined(self, "framerate", input.framerate);
  if (input.duration !== undefined) {
    self["duration"] = Duration.fromInputUnsafe(input.duration);
  }
  setIfDefined(self, "metadata", input.metadata);
  return self as unknown as Sequence.Sequence;
};

/** @internal */
export const addTrack = <Tracks extends readonly Track.Track[]>(
  self: Sequence.Sequence<Tracks>,
  input: Track.Input,
): Sequence.Sequence<readonly [...Tracks, Track.Track]> =>
  copyWith(self, {
    tracks: [...self.tracks, track.make(input)],
  }) as unknown as Sequence.Sequence<readonly [...Tracks, Track.Track]>;

/** @internal */
export const withTracks = <Tracks extends readonly Track.Input[]>(
  self: Sequence.Sequence,
  tracks: Tracks,
): Sequence.Sequence<Sequence.NormalizeTracks<Tracks>> =>
  copyWith(self, { tracks: normalizeTracks(tracks) }) as Sequence.Sequence<
    Sequence.NormalizeTracks<Tracks>
  >;

/** @internal */
export const withSize = <Tracks extends readonly Track.Track[]>(
  self: Sequence.Sequence<Tracks>,
  size: Sequence.SizeInput,
): Sequence.Sequence<Tracks> => copyWith(self, { size: normalizeSize(size) });

/** @internal */
export const withFramerate = <Tracks extends readonly Track.Track[]>(
  self: Sequence.Sequence<Tracks>,
  framerate: number,
): Sequence.Sequence<Tracks> => copyWith(self, { framerate });

/** @internal */
export const withDuration = <Tracks extends readonly Track.Track[]>(
  self: Sequence.Sequence<Tracks>,
  duration: Duration.Input,
): Sequence.Sequence<Tracks> =>
  copyWith(self, { duration: Duration.fromInputUnsafe(duration) });

/** @internal */
export const withName = <Tracks extends readonly Track.Track[]>(
  self: Sequence.Sequence<Tracks>,
  name: string,
): Sequence.Sequence<Tracks> => copyWith(self, { name });

/** @internal */
export const withMetadata = <Tracks extends readonly Track.Track[]>(
  self: Sequence.Sequence<Tracks>,
  metadata: Readonly<Record<string, unknown>>,
): Sequence.Sequence<Tracks> => copyWith(self, { metadata });

/** @internal */
export const isSequence = (input: unknown): input is Sequence.Sequence =>
  hasProperty(input, TypeId);
