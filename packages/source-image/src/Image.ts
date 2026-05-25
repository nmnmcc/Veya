import { Effect, Stream } from "effect";
import { Effectable } from "@veya/core";
import type { Size, VideoClip } from "@veya/core";
import { ImageSource } from "./ImageSource";

export namespace Image {
  export type MediaSource<E = never, R = never> = ImageSource.MediaSource<E, R>;

  export type Service = InstanceType<typeof ImageSource>;

  export const ImageSourceError = ImageSource.ImageSourceError;
  export type ImageSourceError = ImageSource.ImageSourceError;

  export type DecodeOptions = ImageSource.DecodeOptions;

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

  export const make = Effect.fn("Image.make")(function* <SourceE = never, SourceR = never, E = never, R = never>(
    source: Effectable<MediaSource<SourceE, SourceR>, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Effect.fn.Return<Image<SourceE, SourceR, E, R>, E, R> {
    const [resolvedSource, resolvedOptions] = yield* Effectable.all([source, options] as const);

    return {
      source: resolvedSource,
      size: resolvedOptions.size,
      render: Stream.unwrap(
        Effect.gen(function* () {
          const { decode } = yield* ImageSource;
          const decodeOptions = yield* resolveDecodeOptions(resolvedOptions);
          const bitmap = yield* decode(resolvedSource, decodeOptions);

          return Stream.make(bitmap);
        }),
      ),
    };
  });

  const resolveDecodeOptions = <E, R>(options: Options<E, R>): Effect.Effect<DecodeOptions, E, R> => {
    return Effectable.all({
      size: options.size,
    });
  };
}
