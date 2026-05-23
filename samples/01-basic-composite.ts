import {
  AudioTrack,
  ChannelCount,
  Composite,
  FrameCount,
  Gap,
  SampleCount,
  SampleRate,
  Silence,
  Size,
  VideoTrack,
} from "@veya/core";

const sampleRate = SampleRate(48000);
const channels = ChannelCount(2);

export const composite = Composite.make({
  video: {
    framerate: 24,
    size: Size([1920, 1080]),
    tracks: [VideoTrack.make([Gap.make(FrameCount(24))])],
  },
  audio: {
    sampleRate,
    channels,
    tracks: [
      AudioTrack.make([
        Silence.make({
          sampleRate,
          channels,
          samples: SampleCount(48000),
        }),
      ]),
    ],
  },
});
