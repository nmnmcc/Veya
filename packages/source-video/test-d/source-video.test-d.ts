import { Duration, Effect, Stream } from "effect";
import { expectAssignable, expectError, expectNotAssignable, expectType } from "tsd";
import type { Bitmap, FrameCount, VideoClip } from "@veya/core";
import { Video, VideoFrame, VideoProbe, VideoSource } from "@veya/source-video";

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never;

interface StreamContext {
  readonly streamContext: "stream";
}

declare const bytes: Uint8Array;
declare const byteStream: Stream.Stream<Uint8Array, "stream-error", StreamContext>;

expectAssignable<typeof VideoFrame.resolveOffset>(VideoFrame.resolveOffset);
expectAssignable<typeof VideoFrame.resolveDuration>(VideoFrame.resolveDuration);
expectAssignable<typeof VideoProbe>(VideoProbe);
expectAssignable<typeof VideoSource>(VideoSource);
expectAssignable<typeof Video.make>(Video.make);

expectAssignable<VideoSource.MediaSource>(bytes);
expectAssignable<VideoSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<VideoSource.MediaSource>("video.mp4");

expectAssignable<VideoSource.DecodeOptions>({
  size: [1920, 1080],
  framerate: 24,
  offset: 12,
  frames: 48,
  playback: "loop",
  speed: 1.25,
});
expectError<VideoSource.DecodeOptions>({ playback: "repeat" });
expectError<VideoSource.DecodeOptions>({ frames: "48" });

declare const videoSourceService: VideoSource.Service;
expectAssignable<Stream.Stream<Bitmap, "stream-error" | VideoSource.VideoSourceError, StreamContext>>(
  videoSourceService.decode(byteStream, { frames: 12 }),
);

declare const videoProbeService: (typeof VideoProbe)["Service"];
expectAssignable<Effect.Effect<VideoProbe.Metadata, "stream-error" | VideoProbe.VideoProbeError, StreamContext>>(
  videoProbeService.probe(byteStream),
);
expectAssignable<VideoProbe.Metadata>({
  size: [1920, 1080],
  framerate: 24,
  frames: 96,
  duration: Duration.seconds(4),
});

const videoEffect = Video.make(byteStream, {
  size: [320, 180],
  framerate: 24,
  offset: VideoFrame.millis(500),
  duration: VideoFrame.seconds(1),
  playback: "freeze",
  speed: 1.25,
});
expectAssignable<Effect.Effect<Video.Video<"stream-error", StreamContext>, never, never>>(videoEffect);
declare const videoClip: EffectSuccess<typeof videoEffect>;
expectAssignable<
  VideoClip.VideoClip<
    "stream-error" | Video.VideoSourceError | VideoProbe.VideoProbeError | VideoFrame.VideoFrameError,
    StreamContext | Video.Service | VideoProbe
  >
>(videoClip);
expectType<typeof VideoSource.VideoSourceError>(Video.VideoSourceError);
expectError(Video.make("video.mp4"));
expectError(Video.make(bytes, { playback: "repeat" }));

expectAssignable<VideoFrame.TimeInput>(VideoFrame.seconds(1));
expectAssignable<VideoFrame.TimeInput>(VideoFrame.millis(250));
expectAssignable<VideoFrame.Input>(24);
expectAssignable<VideoFrame.Input>(VideoFrame.seconds(1));
expectType<boolean>(VideoFrame.requiresFramerate(VideoFrame.seconds(1)));
expectAssignable<Effect.Effect<VideoFrame.Index, VideoProbe.VideoProbeError | VideoFrame.VideoFrameError, VideoProbe>>(
  VideoFrame.resolveOffset(24, {}),
);
expectAssignable<Effect.Effect<FrameCount, VideoProbe.VideoProbeError | VideoFrame.VideoFrameError, VideoProbe>>(
  VideoFrame.resolveDuration(24, {}),
);
expectError(VideoFrame.resolveOffset(24, { rounding: "nearest" }));
