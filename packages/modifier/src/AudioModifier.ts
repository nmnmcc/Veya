import { Effect, Stream, pipe } from "effect";
import { Effectable } from "@veya/core";
import type { AudioChunk, AudioClip, ChannelCount, Samplerate } from "@veya/core";

export namespace AudioModifier {
  export interface ChunkContext {
    readonly index: number;
    readonly samplesBefore: number;
    readonly samplerate?: Samplerate;
    readonly channels?: ChannelCount;
  }

  export interface ContextOptions {
    readonly samplerate?: Samplerate;
    readonly channels?: ChannelCount;
  }

  export interface Options<E = never, R = never> {
    readonly context?: Effectable<ContextOptions, E, R>;
  }

  export interface AudioModifier<E = never, R = never> {
    readonly apply: (chunk: AudioChunk, context: ChunkContext) => Effect.Effect<AudioChunk, E, R>;
  }

  export interface StatefulAudioModifier<State, E = never, R = never> {
    readonly initial: () => Effect.Effect<State, E, R>;
    readonly apply: (
      state: State,
      chunk: AudioChunk,
      context: ChunkContext,
    ) => Effect.Effect<readonly [state: State, chunks: readonly AudioChunk[]], E, R>;
  }

  export const make = <E = never, R = never>(
    apply: (chunk: AudioChunk, context: ChunkContext) => Effect.Effect<AudioChunk, E, R>,
  ): AudioModifier<E, R> => ({ apply });

  export const makeStateful = <State, E = never, R = never>(
    initial: () => State,
    apply: (
      state: State,
      chunk: AudioChunk,
      context: ChunkContext,
    ) => Effect.Effect<readonly [state: State, chunks: readonly AudioChunk[]], E, R>,
  ): StatefulAudioModifier<State, E, R> => ({ initial: () => Effect.succeed(initial()), apply });

  export const makeStatefulEffect = <State, E = never, R = never>(
    initial: () => Effect.Effect<State, E, R>,
    apply: (
      state: State,
      chunk: AudioChunk,
      context: ChunkContext,
    ) => Effect.Effect<readonly [state: State, chunks: readonly AudioChunk[]], E, R>,
  ): StatefulAudioModifier<State, E, R> => ({ initial, apply });

  export const apply =
    <ModifierE = never, ModifierR = never, OptionsE = never, OptionsR = never>(
      modifier: AudioModifier<ModifierE, ModifierR>,
      options: Options<OptionsE, OptionsR> = {},
    ) =>
    <ClipE = never, ClipR = never>(
      clip: AudioClip.AudioClip<ClipE, ClipR>,
    ): AudioClip.AudioClip<ClipE | ModifierE | OptionsE, ClipR | ModifierR | OptionsR> => ({
      render: Stream.unwrap(
        Effect.map(resolveContext(options), (context) =>
          pipe(
            clip.render,
            Stream.mapAccumEffect(
              () => ({ index: 0, samplesBefore: 0 }),
              ({ index, samplesBefore }, chunk) =>
                Effect.map(modifier.apply(chunk, { ...context, index, samplesBefore }), (chunk) => [
                  {
                    index: index + 1,
                    samplesBefore: samplesBefore + getSampleCount(chunk),
                  },
                  [chunk],
                ]),
            ),
          ),
        ),
      ),
    });

  export const applyStateful =
    <State, ModifierE = never, ModifierR = never, OptionsE = never, OptionsR = never>(
      modifier: StatefulAudioModifier<State, ModifierE, ModifierR>,
      options: Options<OptionsE, OptionsR> = {},
    ) =>
    <ClipE = never, ClipR = never>(
      clip: AudioClip.AudioClip<ClipE, ClipR>,
    ): AudioClip.AudioClip<ClipE | ModifierE | OptionsE, ClipR | ModifierR | OptionsR> => ({
      render: Stream.unwrap(
        Effect.gen(function* () {
          const context = yield* resolveContext(options);
          const initial = yield* modifier.initial();

          return pipe(
            clip.render,
            Stream.mapAccumEffect(
              () => ({ modifierState: initial, index: 0, samplesBefore: 0 }),
              ({ modifierState, index, samplesBefore }, chunk) =>
                Effect.map(
                  modifier.apply(modifierState, chunk, { ...context, index, samplesBefore }),
                  ([modifierState, chunks]) => [
                    {
                      modifierState,
                      index: index + 1,
                      samplesBefore: samplesBefore + getSampleCountAll(chunks),
                    },
                    chunks,
                  ],
                ),
            ),
          );
        }),
      ),
    });

  export const chain = <FirstE = never, FirstR = never, SecondE = never, SecondR = never>(
    first: AudioModifier<FirstE, FirstR>,
    second: AudioModifier<SecondE, SecondR>,
  ): AudioModifier<FirstE | SecondE, FirstR | SecondR> => ({
    apply: (chunk, context) => Effect.flatMap(first.apply(chunk, context), (chunk) => second.apply(chunk, context)),
  });

  export const passthrough: AudioModifier = make((chunk) => Effect.succeed(chunk));

  export const getSampleCount = (chunk: AudioChunk): number => {
    return chunk.channels[0]?.length ?? 0;
  };

  const resolveContext = <E, R>(options: Options<E, R>): Effect.Effect<ContextOptions, E, R> => {
    return options.context === undefined ? Effect.succeed({}) : Effectable.resolve(options.context);
  };

  const getSampleCountAll = (chunks: readonly AudioChunk[]): number => {
    return chunks.reduce((samples, chunk) => samples + getSampleCount(chunk), 0);
  };
}
