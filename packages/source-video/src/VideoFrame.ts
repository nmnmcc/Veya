import { Data, Duration, Effect } from "effect";
import { Effectable } from "@veya/core";
import type { FrameCount as FrameCountType } from "@veya/core";
import { VideoProbe } from "./VideoProbe";

export namespace VideoFrame {
  export type TimeInput = Exclude<Duration.Input, number>;

  export type Input = FrameCountType | TimeInput;

  export type Index = number;

  export type Rounding = "floor" | "ceil" | "round";

  export interface ResolveOptions<SourceE = never, SourceR = never, E = never, R = never> {
    readonly source?: Effectable<VideoProbe.MediaSource<SourceE, SourceR>, E, R>;
    readonly framerate?: Effectable<number, E, R>;
    readonly rounding?: Effectable<Rounding, E, R>;
  }

  export class VideoFrameError extends Data.TaggedError("VideoFrameError")<{
    readonly reason?: unknown;
  }> {}

  export const seconds = (seconds: number): TimeInput => Duration.seconds(seconds);

  export const millis = (millis: number): TimeInput => Duration.millis(millis);

  export const requiresFramerate = (input: Input): boolean => typeof input !== "number";

  export const resolveFramerate = <SourceE = never, SourceR = never, E = never, R = never>(
    inputs: readonly (Input | undefined)[],
    options: ResolveOptions<SourceE, SourceR, E, R>,
  ): Effect.Effect<
    number | undefined,
    SourceE | E | VideoProbe.VideoProbeError | VideoFrameError,
    SourceR | R | VideoProbe
  > => {
    if (options.framerate !== undefined) return Effectable.resolve(options.framerate);
    if (!inputs.some((input) => input !== undefined && requiresFramerate(input))) return Effect.succeed(undefined);

    const sourceInput = options.source;
    if (sourceInput === undefined) {
      return Effect.fail(new VideoFrameError({ reason: "framerate is required to resolve a time value" }));
    }

    return Effect.gen(function* () {
      const source = yield* Effectable.resolve(sourceInput);
      const { probe } = yield* VideoProbe;
      const metadata = yield* probe(source);

      return metadata.framerate;
    });
  };

  export const resolveOffset = <SourceE = never, SourceR = never, E = never, R = never>(
    input: Effectable<Input, E, R>,
    options: ResolveOptions<SourceE, SourceR, E, R>,
  ): Effect.Effect<Index, SourceE | E | VideoProbe.VideoProbeError | VideoFrameError, SourceR | R | VideoProbe> => {
    return Effect.gen(function* () {
      const resolvedInput = yield* Effectable.resolve(input);

      return yield* resolveFrameNumber(resolvedInput, {
        ...options,
        defaultRounding: "floor",
        minimum: 0,
      });
    });
  };

  export const resolveDuration = <SourceE = never, SourceR = never, E = never, R = never>(
    input: Effectable<Input, E, R>,
    options: ResolveOptions<SourceE, SourceR, E, R>,
  ): Effect.Effect<
    FrameCountType,
    SourceE | E | VideoProbe.VideoProbeError | VideoFrameError,
    SourceR | R | VideoProbe
  > => {
    return Effect.gen(function* () {
      const resolvedInput = yield* Effectable.resolve(input);

      return yield* resolveFrameNumber(resolvedInput, {
        ...options,
        defaultRounding: "ceil",
        minimum: 1,
      });
    });
  };

  const resolveFrameNumber = <SourceE, SourceR, E, R>(
    input: Input,
    options: ResolveOptions<SourceE, SourceR, E, R> & {
      readonly defaultRounding: Rounding;
      readonly minimum: number;
    },
  ): Effect.Effect<number, SourceE | E | VideoProbe.VideoProbeError | VideoFrameError, SourceR | R | VideoProbe> => {
    if (typeof input === "number") return validateFrameNumber(input, options.minimum);

    return Effect.gen(function* () {
      const framerate = yield* resolveFramerate([input], options);
      const rounding =
        options.rounding === undefined ? options.defaultRounding : yield* Effectable.resolve(options.rounding);

      if (framerate === undefined) {
        return yield* Effect.fail(new VideoFrameError({ reason: "framerate is required to resolve a time value" }));
      }

      if (!Number.isFinite(framerate) || framerate <= 0) {
        return yield* Effect.fail(new VideoFrameError({ reason: "framerate must be a positive finite number" }));
      }

      const millis = Duration.toMillis(input);
      if (!Number.isFinite(millis) || millis < 0) {
        return yield* Effect.fail(new VideoFrameError({ reason: "time value must be a non-negative finite duration" }));
      }

      const frames = applyRounding((millis / 1000) * framerate, rounding);
      return yield* validateFrameNumber(frames, options.minimum);
    });
  };

  const validateFrameNumber = (frames: number, minimum: number): Effect.Effect<number, VideoFrameError> => {
    if (!Number.isInteger(frames) || frames < minimum) {
      return Effect.fail(new VideoFrameError({ reason: `frame value must be an integer >= ${minimum}` }));
    }

    return Effect.succeed(frames);
  };

  const applyRounding = (frames: number, rounding: Rounding): number => {
    switch (rounding) {
      case "floor":
        return Math.floor(frames);
      case "ceil":
        return Math.ceil(frames);
      case "round":
        return Math.round(frames);
    }
  };
}
