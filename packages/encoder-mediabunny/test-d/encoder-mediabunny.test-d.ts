import { expectAssignable, expectError } from "tsd";
import { Encoder } from "@veya/core";
import type { Composite } from "@veya/core";
import { MediabunnyEncoder } from "@veya/encoder-mediabunny";

interface Runtime {
  readonly runtime: "runtime";
}

declare const composite: Composite.Composite<"composite-error", Runtime>;

expectAssignable<typeof MediabunnyEncoder.make>(MediabunnyEncoder.make);
expectAssignable<typeof MediabunnyEncoder.layer>(MediabunnyEncoder.layer);
expectAssignable<Encoder.Encoder>(MediabunnyEncoder.make());
expectAssignable<MediabunnyEncoder.Options>({
  video: { codec: "vp9" },
  audio: { codec: "opus" },
});
expectError<MediabunnyEncoder.Options>({ video: { codec: "h264" } });

const encoded = MediabunnyEncoder.make().encode(composite, {
  container: "webm",
  filename: "out.webm",
  video: { codec: "vp9", bitrate: 4_000_000 },
  audio: { codec: "opus", bitrate: 128_000 },
});
expectAssignable<Encoder.EncodedFile<"composite-error" | Encoder.EncoderError, Runtime>>(encoded);
