import { Array as EffectArray, pipe } from "effect";

import { VideoColor, VideoFrame } from "@veya/core";

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

export const digits: readonly VideoFrame[] = pipe(
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
          VideoFrame.set(channels, size, x, y, VideoColor.White);
        }
      }
    }

    return channels;
  }),
);
