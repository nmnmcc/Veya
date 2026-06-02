import { Array as EffectArray, pipe } from "effect";

import { VideoClip, VideoColor } from "@veya/core";

export type Bit = 0 | 1;
export type Digit = readonly [
  readonly [Bit, Bit, Bit],
  readonly [Bit, Bit, Bit],
  readonly [Bit, Bit, Bit],
  readonly [Bit, Bit, Bit],
  readonly [Bit, Bit, Bit],
  readonly [Bit, Bit, Bit],
  readonly [Bit, Bit, Bit],
];

export const digits: readonly VideoClip.Bitmap[] = pipe(
  [
    [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    [
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
    [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
  ] as const satisfies readonly Digit[],
  EffectArray.map((digit) => {
    const size = [3, 7] as const;
    const channels = new Uint8ClampedArray(size[0] * size[1] * 4);

    for (let y = 0; y < digit.length; y += 1) {
      const row = digit[y]!;

      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === 1) {
          VideoClip.Bitmap.set(channels, size, x, y, VideoClip.Pixel.fromColor(VideoColor.White));
        }
      }
    }

    return VideoClip.Bitmap.fromChannelsUnsafe(channels);
  }),
);
