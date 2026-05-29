import { Effect, pipe, Ref, Stream } from "effect";

import { Effectable, type Size, type VideoClip, VideoColorSpace, VideoContext, type VideoTick } from "@veya/core";

import { CanvasRenderingContext } from "./CanvasRenderingContext";

export namespace Canvas {
  export interface Canvas<E = never, R = never> extends VideoClip.VideoClip<
    VideoTick,
    never,
    never,
    E | CanvasRenderingContext.Error,
    R | VideoContext | CanvasRenderingContext
  > {}

  export type Options<E = never, R = never> = {
    /** Frame size in pixels. Defaults to the active `VideoContext` size. */
    readonly size?: Effectable<Size, E, R> | undefined;
    /** Frame rate in frames per second. Defaults to the active `VideoContext` framerate. */
    readonly framerate?: Effectable<number, E, R> | undefined;
    /** Canvas color space. Defaults to the active `VideoContext` color space or `srgb`. */
    readonly colorSpace?: Effectable<VideoColorSpace.VideoColorSpace, E, R> | undefined;
  };

  export interface ResolvedOptions {
    /** Frame size in pixels. */
    readonly size: Size;
    /** Frame rate in frames per second. */
    readonly framerate: number;
    /** Canvas color space. */
    readonly colorSpace: VideoColorSpace.VideoColorSpace;
  }

  export type Draw<S, E, R> = (
    /** Zero-based frame index. */
    index: number,
    /** State returned by the previous draw call, or the initial state for the first frame. */
    state: S,
    /** Resolved output settings for the current clip. */
    options: ResolvedOptions,
  ) => Effect.Effect<S, E, R | CanvasRenderingContext>;

  export const make =
    <S, IE = never, IR = never, DE = never, DR = never, OE = never, OR = never>(
      init: Effect.Effect<S, IE, IR>,
      draw: Draw<S, DE, DR>,
      duration: number,
      options: Options<OE, OR> = {},
    ): Canvas<IE | DE | OE, IR | DR | OR> =>
    (stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const video = yield* VideoContext;
          const { make, snapshot } = yield* CanvasRenderingContext;
          const _options = yield* Effect.all(
            Effectable.options(
              {
                size: video.size,
                framerate: video.framerate,
                colorSpace: video.colorSpace ?? VideoColorSpace.Default,
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

                return snapshot(context, _options.size);
              }),
            ),
            Stream.provideService(CanvasRenderingContext.Context2D, context),
          );
        }),
      );
}
