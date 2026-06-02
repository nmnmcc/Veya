import { Context, Data, Layer, Stream } from "effect";

import { Encodable } from "./Encodable";
import { VideoClip } from "./VideoClip";
import { VideoContext } from "./VideoContext";

export class VideoResampler extends Context.Service<VideoResampler, VideoResampler.VideoResampler>()(
  "@veya/core/VideoResampler",
) {}

export namespace VideoResampler {
  export interface VideoResampler {
    readonly resample: <I, IE = never, IR = never, OE = never, OR = never>(
      clip: VideoClip.VideoClip<I, IE, IR, OE, OR>,
      options: Options,
    ) => VideoClip.VideoClip<I, IE, IR, OE | Error, OR>;
  }

  export interface Options {
    /** Source frame rate in frames per second. */
    readonly source?: number;
    /** Target frame rate in frames per second. */
    readonly target: number;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ResampleFailed;
  }> {}
  export namespace Error {
    export class ResampleFailed extends Data.TaggedError("ResampleFailed")<{}> {}
  }

  export const service = VideoResampler.of({
    resample: (clip, options) => (stream) => {
      const encodable = clip(stream);
      const source = options.source ?? encodable.context.framerate;
      const target = options.target;
      const context = VideoContext.of({ ...encodable.context, framerate: target });

      if (!isValidFramerate(source) || !isValidFramerate(target)) {
        return Encodable.make(Stream.fail(makeError(source, target)), context);
      }

      if (source === target) return Encodable.make(encodable, context);

      return Encodable.make(resampleStream(encodable, source, target), context);
    },
  });

  export const make = () => service;

  export const layer = Layer.succeed(VideoResampler, service);

  interface State {
    readonly source: number;
    readonly target: number;
  }

  const resampleStream = <E, R>(
    stream: Stream.Stream<VideoClip.Bitmap, E, R>,
    source: number,
    target: number,
  ): Stream.Stream<VideoClip.Bitmap, E, R> =>
    stream.pipe(
      Stream.mapAccum<State, VideoClip.Bitmap, VideoClip.Bitmap>(
        () => ({ source: 0, target: 0 }),
        (state, bitmap) => {
          const frames: VideoClip.Bitmap[] = [];
          let targetFrame = state.target;

          while (targetFrame * source < (state.source + 1) * target) {
            frames.push(bitmap);
            targetFrame += 1;
          }

          return [
            {
              source: state.source + 1,
              target: targetFrame,
            },
            frames,
          ];
        },
      ),
    );

  const isValidFramerate = (framerate: number): boolean => Number.isFinite(framerate) && framerate > 0;

  const makeError = (source: number, target: number): Error =>
    new Error({
      cause: new globalThis.Error(`Video framerate must be positive, got source ${source} and target ${target}.`),
      reason: new Error.ResampleFailed(),
    });
}
