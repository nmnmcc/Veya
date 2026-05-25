import { Effect, Stream } from "effect";
import { expectAssignable, expectError, expectNotAssignable, expectType } from "tsd";
import type { Bitmap, VideoClip } from "@veya/core";
import { Image, ImageProbe, ImageSource } from "@veya/source-image";

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never;

interface StreamContext {
  readonly streamContext: "stream";
}

interface OptionContext {
  readonly optionContext: "option";
}

declare const bytes: Uint8Array;
declare const byteStream: Stream.Stream<Uint8Array, "stream-error", StreamContext>;
declare const optionSize: Effect.Effect<readonly [width: number, height: number], "option-error", OptionContext>;

expectAssignable<typeof ImageProbe>(ImageProbe);
expectAssignable<typeof ImageSource>(ImageSource);
expectAssignable<typeof Image.make>(Image.make);

expectAssignable<ImageSource.MediaSource>(bytes);
expectAssignable<ImageSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<ImageSource.MediaSource>("image.png");

expectAssignable<ImageSource.DecodeOptions>({ size: [320, 180] });
expectError<ImageSource.DecodeOptions>({ size: [320] });

declare const imageSourceService: ImageSource.Service;
expectAssignable<Effect.Effect<Bitmap, "stream-error" | ImageSource.ImageSourceError, StreamContext>>(
  imageSourceService.decode(byteStream, { size: [320, 180] }),
);

declare const imageProbeService: (typeof ImageProbe)["Service"];
expectAssignable<Effect.Effect<ImageProbe.Metadata, "stream-error" | ImageProbe.ImageProbeError, StreamContext>>(
  imageProbeService.probe(byteStream),
);
expectAssignable<ImageProbe.Metadata>({ size: [320, 180] });

const imageEffect = Image.make(byteStream, { size: optionSize });
expectAssignable<
  Effect.Effect<
    Image.Image<"stream-error", StreamContext, "option-error", OptionContext>,
    "option-error",
    OptionContext
  >
>(imageEffect);
declare const imageClip: EffectSuccess<typeof imageEffect>;
expectAssignable<
  VideoClip.VideoClip<
    "stream-error" | Image.ImageSourceError | "option-error",
    StreamContext | Image.Service | OptionContext
  >
>(imageClip);
expectType<typeof ImageSource.ImageSourceError>(Image.ImageSourceError);
expectError(Image.make("image.png"));
expectError(Image.make(bytes, { size: [320] }));
