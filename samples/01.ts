import { Stream } from "effect";

import { CanvasCompositor } from "@veya/canvas";
import { Color } from "@veya/color";
import { VideoComposite, VideoCompositor, VideoContext, VideoTick, VideoTrack } from "@veya/core";

const color = Color.make([1, 1, 1, 0], 60);

export default VideoComposite.make([VideoTrack.make([color, Color.make([1, 1, 1, 0], 60)])])(VideoTick.frames()).pipe(
  Stream.provideService(VideoContext, {
    framerate: 24,
    size: [1920, 1080],
  }),
  Stream.provideService(VideoCompositor, CanvasCompositor.make()),
);
