import { Effect, Stream, pipe } from "effect";
import { Effectable } from "@veya/core";
import type { Bitmap, Size, VideoClip } from "@veya/core";

export namespace VideoModifier {
  export interface FrameContext {
    readonly index: number;
    readonly size?: Size;
    readonly framerate?: number;
  }

  export interface ContextOptions {
    readonly size?: Size;
    readonly framerate?: number;
  }

  export interface Options<E = never, R = never> {
    readonly context?: Effectable<ContextOptions, E, R>;
  }

  export interface VideoModifier<E = never, R = never> {
    readonly apply: (frame: Bitmap, context: FrameContext) => Effect.Effect<Bitmap, E, R>;
  }

  export interface StatefulVideoModifier<State, E = never, R = never> {
    readonly initial: () => Effect.Effect<State, E, R>;
    readonly apply: (
      state: State,
      frame: Bitmap,
      context: FrameContext,
    ) => Effect.Effect<readonly [state: State, frames: readonly Bitmap[]], E, R>;
  }

  export const make = <E = never, R = never>(
    apply: (frame: Bitmap, context: FrameContext) => Effect.Effect<Bitmap, E, R>,
  ): VideoModifier<E, R> => ({ apply });

  export const makeStateful = <State, E = never, R = never>(
    initial: () => State,
    apply: (
      state: State,
      frame: Bitmap,
      context: FrameContext,
    ) => Effect.Effect<readonly [state: State, frames: readonly Bitmap[]], E, R>,
  ): StatefulVideoModifier<State, E, R> => ({ initial: () => Effect.succeed(initial()), apply });

  export const makeStatefulEffect = <State, E = never, R = never>(
    initial: () => Effect.Effect<State, E, R>,
    apply: (
      state: State,
      frame: Bitmap,
      context: FrameContext,
    ) => Effect.Effect<readonly [state: State, frames: readonly Bitmap[]], E, R>,
  ): StatefulVideoModifier<State, E, R> => ({ initial, apply });

  export const apply =
    <ModifierE = never, ModifierR = never, OptionsE = never, OptionsR = never>(
      modifier: VideoModifier<ModifierE, ModifierR>,
      options: Options<OptionsE, OptionsR> = {},
    ) =>
    <ClipE = never, ClipR = never>(
      clip: VideoClip.VideoClip<ClipE, ClipR>,
    ): VideoClip.VideoClip<ClipE | ModifierE | OptionsE, ClipR | ModifierR | OptionsR> => ({
      render: Stream.unwrap(
        Effect.map(resolveContext(options), (context) =>
          pipe(
            clip.render,
            Stream.mapEffect((frame, index) => modifier.apply(frame, { ...context, index })),
          ),
        ),
      ),
    });

  export const applyStateful =
    <State, ModifierE = never, ModifierR = never, OptionsE = never, OptionsR = never>(
      modifier: StatefulVideoModifier<State, ModifierE, ModifierR>,
      options: Options<OptionsE, OptionsR> = {},
    ) =>
    <ClipE = never, ClipR = never>(
      clip: VideoClip.VideoClip<ClipE, ClipR>,
    ): VideoClip.VideoClip<ClipE | ModifierE | OptionsE, ClipR | ModifierR | OptionsR> => ({
      render: Stream.unwrap(
        Effect.gen(function* () {
          const context = yield* resolveContext(options);
          const initial = yield* modifier.initial();

          return pipe(
            clip.render,
            Stream.mapAccumEffect(
              () => ({ modifierState: initial, index: 0 }),
              ({ modifierState, index }, frame) =>
                Effect.map(modifier.apply(modifierState, frame, { ...context, index }), ([modifierState, frames]) => [
                  { modifierState, index: index + 1 },
                  frames,
                ]),
            ),
          );
        }),
      ),
    });

  export const chain = <FirstE = never, FirstR = never, SecondE = never, SecondR = never>(
    first: VideoModifier<FirstE, FirstR>,
    second: VideoModifier<SecondE, SecondR>,
  ): VideoModifier<FirstE | SecondE, FirstR | SecondR> => ({
    apply: (frame, context) => Effect.flatMap(first.apply(frame, context), (frame) => second.apply(frame, context)),
  });

  export const passthrough: VideoModifier = make((frame) => Effect.succeed(frame));

  const resolveContext = <E, R>(options: Options<E, R>): Effect.Effect<ContextOptions, E, R> => {
    return Effect.map(Effectable.all({ context: options.context ?? {} }), ({ context }) => context);
  };
}
