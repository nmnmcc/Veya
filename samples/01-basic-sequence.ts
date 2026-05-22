import { Gap, Sequence, Track, pipe } from "@veya/core";
import { Image } from "@veya/image";
import { Video } from "@veya/video";

const lowerThird = Sequence.make({
  name: "lower-third",
  size: [900, 180],
  tracks: [
    [
      Image.make("assets/lower-third.png", {
        fit: "contain",
        duration: "3 seconds",
      }),
    ],
  ],
});

const program = pipe(
  Sequence.make({
    size: [1920, 1080],
    framerate: 30,
    tracks: [
      Track.make({
        name: "picture",
        items: [
          Video.make("assets/intro.mp4", {
            fit: "cover",
            duration: "2 seconds",
          }),
          Gap.make("500 millis"),
          Image.make("assets/cover.png", {
            fit: "contain",
            duration: "3 seconds",
          }),
          lowerThird,
        ],
      }),
      Track.make({
        name: "caption",
        items: [
          Gap.make("1 second"),
          Image.make("assets/caption.png", {
            fit: "contain",
            duration: "2 seconds",
          }),
        ],
      }),
    ],
    metadata: {
      title: "Launch teaser",
    },
  }),
  Sequence.withName("basic-sequence"),
);

console.log(JSON.stringify(program.toJSON(), null, 2));
