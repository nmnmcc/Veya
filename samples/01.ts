import { Stream } from "effect";

import { Color } from "@veya/color";
import { VideoComposite, VideoCompositor, VideoContext, VideoTrack } from "@veya/core";

const color = Color.make([1, 1, 1, 0], 60);

export default VideoComposite.make([VideoTrack.make([color, Color.make([1, 1, 1, 0], 60)])]).pipe(
  Stream.provideService(VideoContext, {
    framerate: 24,
    size: [1920, 1080],
  }),
  Stream.provideService(VideoCompositor, {
    composite: (layers, options) => {},
  }),
);
