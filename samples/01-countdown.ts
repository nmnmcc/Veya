import { Color } from "@veya/color";
import { Composite, VideoTrack } from "@veya/core";

export default Composite.make({
  video: [VideoTrack.make([Color.make([1, 1, 1, 0], 60)])],
  audio: [],
});
