import { Image, Sequence, Slot, Track, Video, pipe } from "../src/index";

const timingBase = Track.make({
  name: "beats",
  items: [
    Slot.make("2 seconds"),
    Slot.make("3 seconds"),
    Slot.make("1 second"),
  ],
  metadata: {
    role: "timing-grid",
  },
});

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
      timingBase,
      Track.make({
        name: "picture",
        items: [
          Video.make("assets/intro.mp4", {
            fit: "cover",
            duration: "2 seconds",
          }),
          Image.make("assets/cover.png", {
            fit: "contain",
            duration: "3 seconds",
          }),
          lowerThird,
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
