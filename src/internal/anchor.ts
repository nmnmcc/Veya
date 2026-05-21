import * as Duration from "effect/Duration";
import type * as Anchor from "../Anchor";
import { PipeableProto, hasProperty } from "./common";
import { AnchorTypeId } from "./typeIds";

/** @internal */
export const TypeId = AnchorTypeId;

const CommonProto = {
  [TypeId]: TypeId,
  ...PipeableProto,
};

const FrameProto = {
  ...CommonProto,
  _tag: "Frame",
  toJSON(this: Anchor.Frame) {
    return {
      _id: "Anchor",
      _tag: this._tag,
      frame: this.frame,
    };
  },
  toString(this: Anchor.Frame) {
    return `Anchor.frame(${this.frame})`;
  },
};

const TimeProto = {
  ...CommonProto,
  _tag: "Time",
  toJSON(this: Anchor.Time) {
    return {
      _id: "Anchor",
      _tag: this._tag,
      time: this.time.toString(),
    };
  },
  toString(this: Anchor.Time) {
    return `Anchor.time(${this.time.toString()})`;
  },
};

/** @internal */
export const frame = (frame: number): Anchor.Frame => {
  const self = Object.create(FrameProto) as Record<PropertyKey, unknown>;
  self["frame"] = frame;
  return self as unknown as Anchor.Frame;
};

/** @internal */
export const time = (time: Duration.Input): Anchor.Time => {
  const self = Object.create(TimeProto) as Record<PropertyKey, unknown>;
  self["time"] = Duration.fromInputUnsafe(time);
  return self as unknown as Anchor.Time;
};

/** @internal */
export const isAnchor = (input: unknown): input is Anchor.Anchor =>
  hasProperty(input, TypeId);

/** @internal */
export const isFrame = (input: unknown): input is Anchor.Frame =>
  isAnchor(input) && input._tag === "Frame";

/** @internal */
export const isTime = (input: unknown): input is Anchor.Time =>
  isAnchor(input) && input._tag === "Time";
