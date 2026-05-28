import { Effect } from "effect";
import { BufferTarget, Output } from "mediabunny";
import type { OutputFormat } from "mediabunny";

import { MediabunnyEncoding } from "./MediabunnyEncoding";

export namespace MediabunnyMultiplexer {
  /** In-memory Mediabunny output used to mux encoded samples into a container. */
  export interface Multiplexer {
    /** Container/output format. */
    readonly format: OutputFormat;
    /** Mediabunny output that owns tracks and writes container bytes. */
    readonly output: Output<OutputFormat, BufferTarget>;
    /** In-memory target that receives the muxed bytes. */
    readonly target: BufferTarget;
  }

  /** Options for multiplexing samples into a container. */
  export interface Options<E = never, R = never> {
    /** Container/output format. */
    readonly format: OutputFormat;
    /** Adds tracks and metadata before the output starts. */
    readonly setup?: ((multiplexer: Multiplexer) => void) | undefined;
    /** Writes samples after the output starts and before it is finalized. */
    readonly write: (multiplexer: Multiplexer) => Effect.Effect<void, E, R>;
  }

  /** Muxes samples into an in-memory media file and returns the encoded bytes. */
  export const multiplex = <E = never, R = never>({
    format,
    setup,
    write,
  }: Options<E, R>): Effect.Effect<MediabunnyEncoding.Result, E | MediabunnyEncoding.Error, R> =>
    Effect.gen(function* () {
      const multiplexer = yield* Effect.try({
        try: () => {
          const target = new BufferTarget();

          return {
            format,
            output: new Output({
              format,
              target,
            }),
            target,
          };
        },
        catch: MediabunnyEncoding.toEncodeFailed,
      });

      const program = Effect.gen(function* () {
        yield* configure(multiplexer, setup);
        yield* start(multiplexer.output);
        yield* yieldWrite(multiplexer, write);
        yield* finalize(multiplexer.output);

        return yield* result(multiplexer.target, multiplexer.format);
      });

      return yield* program.pipe(Effect.onError(() => cancel(multiplexer.output)));
    });

  const configure = (
    multiplexer: Multiplexer,
    setup: Options["setup"],
  ): Effect.Effect<void, MediabunnyEncoding.Error> =>
    Effect.try({
      try: () => {
        setup?.(multiplexer);
      },
      catch: MediabunnyEncoding.toEncodeFailed,
    });

  const yieldWrite = <E, R>(
    multiplexer: Multiplexer,
    write: Options<E, R>["write"],
  ): Effect.Effect<void, E | MediabunnyEncoding.Error, R> =>
    Effect.gen(function* () {
      const effect = yield* Effect.try({
        try: () => write(multiplexer),
        catch: MediabunnyEncoding.toEncodeFailed,
      });

      yield* effect;
    });

  const start = (output: Output): Effect.Effect<void, MediabunnyEncoding.Error> =>
    Effect.tryPromise({
      try: () => output.start(),
      catch: MediabunnyEncoding.toEncodeFailed,
    });

  const finalize = (output: Output): Effect.Effect<void, MediabunnyEncoding.Error> =>
    Effect.tryPromise({
      try: () => output.finalize(),
      catch: MediabunnyEncoding.toEncodeFailed,
    });

  const cancel = (output: Output): Effect.Effect<void> =>
    Effect.tryPromise({
      try: async () => {
        if (output.state !== "canceled" && output.state !== "finalized" && output.state !== "finalizing") {
          await output.cancel();
        }
      },
      catch: MediabunnyEncoding.toEncodeFailed,
    }).pipe(Effect.ignore);

  const result = (
    target: BufferTarget,
    format: OutputFormat,
  ): Effect.Effect<MediabunnyEncoding.Result, MediabunnyEncoding.Error> => {
    if (target.buffer === null) {
      return new MediabunnyEncoding.Error({
        reason: new MediabunnyEncoding.Error.InvalidOutputBuffer(),
      });
    }

    return Effect.succeed({
      buffer: new Uint8Array(target.buffer),
      mimeType: format.mimeType,
    });
  };
}
