import {
  Anchor,
  Image,
  Sequence,
  Slot,
  Timing,
  Video,
  pipe,
} from "../src/index";

const openingWindow = Timing.make({
  in: Anchor.frame(0),
  out: Anchor.time("4 seconds"),
});

const titleCard = Image.make({
  source: "assets/title.png",
  fit: "contain",
  ...openingWindow,
});

const background = pipe(
  Video.make("assets/background-loop.mp4"),
  Video.withIn(Anchor.time("1 second")),
  Video.withOut(Anchor.time("6 seconds")),
  Video.withPlayback("loop"),
  Video.withVolume(0.25),
);

const outroTiming = Timing.make({
  in: Anchor.frame(180),
  duration: "2 seconds",
});

const sequence = Sequence.make({
  name: "timed-placement",
  framerate: 30,
  tracks: [
    [Slot.make(openingWindow), Slot.make("2 seconds")],
    [titleCard, background],
    [
      Image.make({
        source: "assets/outro.png",
        fit: "cover",
        ...outroTiming,
      }),
    ],
  ],
});

console.log(JSON.stringify(sequence.toJSON(), null, 2));
