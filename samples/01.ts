import { Color } from "@veya/color";
import { VideoComposite, VideoTrack } from "@veya/core";

const color = Color.make([1, 1, 1, 0], 60);

export default VideoComposite.make([VideoTrack.make([color, Color.make([1, 1, 1, 0], 60)])]);
