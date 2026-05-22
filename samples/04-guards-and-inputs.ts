import { Anchor, Clip, Gap, Image, Sequence, Track, Video } from "../src/index";

const sources = [
  Clip.video(new URL("https://cdn.example.com/intro.mp4"), {
    id: "remote-video",
    duration: "2 seconds",
  }),
  Clip.image(new Uint8Array([137, 80, 78, 71]), {
    id: "generated-image",
    fit: "contain",
    metadata: {
      source: "memory",
    },
  }),
  Clip.gap("1 second"),
];

const sequence = Sequence.make({
  tracks: [sources],
});

const copiedSequence = Sequence.make(sequence);
const namedSequence = Sequence.withName(sequence, "guard-demo");

const values: ReadonlyArray<unknown> = [
  sequence,
  Track.make([Gap.make()]),
  Video.make("assets/video.mp4"),
  Image.make("assets/image.png"),
  Gap.make("500 millis"),
  Anchor.frame(12),
  Anchor.time("3 seconds"),
  { duration: "1 second" },
];

const labels = values.map((value) => {
  if (Sequence.isSequence(value)) {
    return "Sequence";
  }
  if (Track.isTrack(value)) {
    return "Track";
  }
  if (Clip.isVideo(value)) {
    return "Video";
  }
  if (Clip.isImage(value)) {
    return "Image";
  }
  if (Clip.isGap(value)) {
    return "Gap";
  }
  if (Anchor.isFrame(value)) {
    return "Frame";
  }
  if (Anchor.isTime(value)) {
    return "Time";
  }
  return "Unknown";
});

try {
  Track.make([{ duration: "1 second" } as never]);
} catch (error) {
  console.log(
    "plain-object-track-item:",
    error instanceof Error ? error.message : String(error),
  );
}

console.log(
  JSON.stringify(
    {
      labels,
      constructorIsIdempotent: copiedSequence === sequence,
      sequenceWasCopiedImmutably: namedSequence !== sequence,
      sourceSerialization: sequence.toJSON(),
    },
    null,
    2,
  ),
);
