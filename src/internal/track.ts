import type * as Track from "../Track";
import {
  copyWith,
  hasProperty,
  isRecord,
  setIfDefined,
  PipeableProto,
} from "./common";
import * as clip from "./clip";
import { SequenceTypeId, TrackTypeId } from "./typeIds";

/** @internal */
export const TypeId = TrackTypeId;

const Proto = {
  [TypeId]: TypeId,
  ...PipeableProto,
  toJSON(this: Track.Track) {
    const json: Record<string, unknown> = {
      _id: "Track",
      items: this.items.map((item) => item.toJSON()),
    };
    setIfDefined(json, "name", this.name);
    setIfDefined(json, "metadata", this.metadata);
    return json;
  },
  toString(this: Track.Track) {
    return `Track(${JSON.stringify(this.toJSON())})`;
  },
};

const isOptions = (input: unknown): input is Track.Options =>
  isRecord(input) &&
  !Array.isArray(input) &&
  !isTrack(input) &&
  "items" in input;

const isSequence = (input: unknown): input is Track.Element =>
  hasProperty(input, SequenceTypeId);

const ensureElement = (input: Track.Element): Track.Element => {
  if (clip.isClip(input) || isSequence(input)) {
    return input;
  }
  throw new TypeError(
    "Track items must be Clip or Sequence values. Use Slot.make() for empty slots.",
  );
};

/** @internal */
export const make = (input: Track.Input): Track.Track => {
  if (isTrack(input)) {
    return input;
  }
  const options = isOptions(input) ? input : { items: input };
  const self = Object.create(Proto) as Record<PropertyKey, unknown>;
  self["items"] = options.items.map(ensureElement);
  setIfDefined(self, "name", options.name);
  setIfDefined(self, "metadata", options.metadata);
  return self as unknown as Track.Track;
};

/** @internal */
export const append = <Items extends readonly Track.Element[]>(
  self: Track.Track<Items>,
  item: Track.Element,
): Track.Track<readonly [...Items, Track.Element]> =>
  copyWith(self, {
    items: [...self.items, ensureElement(item)],
  }) as unknown as Track.Track<readonly [...Items, Track.Element]>;

/** @internal */
export const prepend = <Items extends readonly Track.Element[]>(
  self: Track.Track<Items>,
  item: Track.Element,
): Track.Track<readonly [Track.Element, ...Items]> =>
  copyWith(self, {
    items: [ensureElement(item), ...self.items],
  }) as unknown as Track.Track<readonly [Track.Element, ...Items]>;

/** @internal */
export const withName = <Items extends readonly Track.Element[]>(
  self: Track.Track<Items>,
  name: string,
): Track.Track<Items> => copyWith(self, { name });

/** @internal */
export const withMetadata = <Items extends readonly Track.Element[]>(
  self: Track.Track<Items>,
  metadata: Readonly<Record<string, unknown>>,
): Track.Track<Items> => copyWith(self, { metadata });

/** @internal */
export const isTrack = (input: unknown): input is Track.Track =>
  hasProperty(input, TypeId);
