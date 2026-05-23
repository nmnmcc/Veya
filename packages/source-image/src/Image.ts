import { Context, Data, Effect, Stream } from "effect";
import { Effectable } from "@veya/core";
import type { Bitmap, Size, VideoClip } from "@veya/core";
import { ImageProbe } from "./ImageProbe";

export namespace Image {
  export type MediaSource<E = never, R = never> = ImageProbe.MediaSource<E, R>;

  export class ImageSourceError extends Data.TaggedError("ImageSourceError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly size?: Size;
  }

  export interface Options<E = never, R = never> {
    readonly size?: Effectable<Size, E, R>;
  }

  export interface Image<SourceE = never, SourceR = never, E = never, R = never> extends VideoClip.VideoClip<
    SourceE | E | ImageSourceError,
    SourceR | R | Service
  > {
    readonly source: Effectable<MediaSource<SourceE, SourceR>, E, R>;
    readonly size?: Effectable<Size, E, R>;
  }

  export interface ImageSource {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Effect.Effect<Bitmap, SourceE | ImageSourceError, SourceR>;
  }

  export class Service extends Context.Service<Service, ImageSource>()("@veya/source-image/Image/Service") {}

  export const make = <SourceE = never, SourceR = never, E = never, R = never>(
    source: Effectable<MediaSource<SourceE, SourceR>, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Image<SourceE, SourceR, E, R> => {
    const immediateOptions = Effect.isEffect(options) ? undefined : options;

    return {
      source,
      size: immediateOptions?.size,
      render: Stream.unwrap(
        Service.use(({ decode }) =>
          Effect.gen(function* () {
            const resolvedSource = yield* Effectable.resolve(source);
            const resolvedOptions = yield* Effectable.resolve(options);
            const decodeOptions = yield* resolveDecodeOptions(resolvedOptions);
            const bitmap = yield* decode(resolvedSource, decodeOptions);

            return Stream.make(bitmap);
          }),
        ),
      ),
    };
  };

  const resolveDecodeOptions = <E, R>(options: Options<E, R>): Effect.Effect<DecodeOptions, E, R> => {
    return Effect.gen(function* () {
      const size = options.size === undefined ? undefined : yield* Effectable.resolve(options.size);

      return { size };
    });
  };
}
