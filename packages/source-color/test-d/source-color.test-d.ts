import { Effect } from "effect";
import { expectAssignable, expectError } from "tsd";
import type { CompositeVideoContext, VideoClip } from "@veya/core";
import { Color } from "@veya/source-color";

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never;

expectAssignable<typeof Color.make>(Color.make);

const colorEffect = Color.make([24, 32, 44, 255], 6, { size: [320, 180] });
expectAssignable<Effect.Effect<Color.Color, never, never>>(colorEffect);
declare const colorClip: EffectSuccess<typeof colorEffect>;
expectAssignable<VideoClip.VideoClip<never, CompositeVideoContext>>(colorClip);
expectError(Color.make([24, 32, 44], 6));
expectError(Color.make([24, 32, 44, 255], "six"));
