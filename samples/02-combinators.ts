import { Image, Sequence, Slot, Track, Video, pipe } from "../src/index";

const intro = pipe(
  Video.make("assets/intro.mp4"),
  Video.withId("clip:intro"),
  Video.withDuration("4 seconds"),
  Video.withFit("cover"),
  Video.withPlayback("clip"),
  Video.withSpeed(1.05),
  Video.withVolume(0.82),
  Video.withMetadata({
    colorGrade: "warm",
  }),
);

const logo = pipe(
  Image.make("assets/logo.png"),
  Image.withTiming({
    duration: "4 seconds",
  }),
  Image.withFit("contain"),
);

const picture = pipe(
  Track.make([intro]),
  Track.prepend(Slot.make("500 millis")),
  Track.append(logo),
  Track.withName("picture"),
  Track.withMetadata({
    blend: "normal",
  }),
);

const captions = Track.withName(
  Track.append(
    Track.make([Slot.make("1 second")]),
    Image.make("assets/caption.png", {
      fit: "contain",
      duration: "3 seconds",
    }),
  ),
  "captions",
);

const sequence = pipe(
  Sequence.make({
    tracks: [picture],
  }),
  Sequence.addTrack(captions),
  Sequence.withSize([1920, 1080]),
  Sequence.withFramerate(24),
  Sequence.withDuration("5 seconds"),
  Sequence.withName("combinator-demo"),
  Sequence.withMetadata({
    version: 1,
  }),
);

console.log(JSON.stringify(sequence.toJSON(), null, 2));
