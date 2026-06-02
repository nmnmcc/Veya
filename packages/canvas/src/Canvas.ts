import { Effect, pipe, Ref, Stream } from "effect";

import { Effectable, type Size, VideoClip, VideoColor, VideoContext } from "@veya/core";

import { CanvasRenderingContext } from "./CanvasRenderingContext";

export namespace Canvas {
  export interface Canvas<I, E = never, R = never> extends VideoClip.VideoClip<
    I,
    never,
    never,
    E | CanvasRenderingContext.Error,
    R | CanvasRenderingContext
  > {}

  export type Options<E = never, R = never> = {
    /** Frame size in pixels. Defaults to the active `VideoContext` size. */
    readonly size?: Effectable<Size, E, R> | undefined;
    /** Frame rate in frames per second. Defaults to the active `VideoContext` framerate. */
    readonly framerate?: Effectable<number, E, R> | undefined;
    /** Canvas color space. Defaults to the active `VideoContext` color space or `srgb`. */
    readonly colorSpace?: Effectable<VideoColor.ColorSpace, E, R> | undefined;
  };

  export interface ResolvedOptions {
    /** Frame size in pixels. */
    readonly size: Size;
    /** Frame rate in frames per second. */
    readonly framerate: number;
    /** Canvas color space. */
    readonly colorSpace: VideoColor.ColorSpace;
  }

  export type Draw<I, S, E, R> = (
    input: I,
    /** State returned by the previous draw call, or the initial state for the first frame. */
    state: S,
    /** Resolved output settings for the current clip. */
    options: ResolvedOptions,
  ) => Effect.Effect<S, E, R | CanvasRenderingContext.Context2D>;

  export const make = <I, S, IE = never, IR = never, DE = never, DR = never, OE = never, OR = never>(
    init: Effect.Effect<S, IE, IR>,
    draw: Draw<I, S, DE, DR>,
    duration: number,
    options: Options<OE, OR> = {},
  ): Effect.Effect<Canvas<I, IE | DE | OE, IR | DR | OR>, never, VideoContext> =>
    VideoClip.make((stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const video = yield* VideoContext;
          const { make, snapshot } = yield* CanvasRenderingContext;
          const _options = yield* Effect.all(
            Effectable.options(
              {
                size: video.size,
                framerate: video.framerate,
                colorSpace: video.colorSpace ?? VideoColor.DefaultColorSpace,
              },
              options,
            ),
            { concurrency: "unbounded" },
          );

          const context = yield* make(_options.size, _options);

          const state = yield* Ref.make(yield* init);
          return pipe(
            stream,
            Stream.take(duration),
            Stream.mapEffect((index) =>
              Effect.gen(function* () {
                const s = yield* Ref.get(state);
                const r = yield* draw(index, s, _options);
                yield* Ref.set(state, r);

                return VideoClip.Bitmap.convertColorSpace(
                  snapshot(context, _options.size, { colorSpace: _options.colorSpace }),
                  {
                    source: _options.colorSpace,
                    target: video.colorSpace,
                  },
                );
              }),
            ),
            Stream.provideService(CanvasRenderingContext.Context2D, context),
          );
        }),
      ),
    );
}
