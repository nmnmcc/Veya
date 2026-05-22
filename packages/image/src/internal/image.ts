import { Clip } from "@veya/core";
import type * as Image from "../Image";

const isRecord = (
  input: unknown,
): input is Readonly<Record<PropertyKey, unknown>> =>
  typeof input === "object" && input !== null;

const setIfDefined = (
  target: Record<PropertyKey, unknown>,
  key: PropertyKey,
  value: unknown,
): void => {
  if (value !== undefined) {
    target[key] = value;
  }
};

const optionsFromSource = <
  Options extends { readonly source: Clip.MediaSource },
>(
  sourceOrOptions: Clip.MediaSource | Options,
  options: Omit<Options, "source"> | undefined,
): {
  readonly source: Clip.MediaSource;
  readonly options: Omit<Options, "source">;
} => {
  if (isRecord(sourceOrOptions) && "source" in sourceOrOptions) {
    const { source, ...rest } = sourceOrOptions;
    return {
      source: source as Clip.MediaSource,
      options: rest as Omit<Options, "source">,
    };
  }
  return {
    source: sourceOrOptions,
    options: options ?? ({} as Omit<Options, "source">),
  };
};

const definition: Clip.MediaDefinition<"Image", Image.Image> = {
  tag: "Image",
  toJSON(self, json) {
    json["source"] = Clip.sourceToJSON(self.source);
    setIfDefined(json, "fit", self.fit);
    return json;
  },
};

/** @internal */
export const make = (
  sourceOrOptions: Clip.MediaSource | Image.OptionsWithSource,
  options?: Image.Options | undefined,
): Image.Image => {
  const normalized = optionsFromSource<Image.OptionsWithSource>(
    sourceOrOptions,
    options,
  );
  const fields: {
    readonly source: Clip.MediaSource;
    fit?: Image.Fit;
  } = {
    source: normalized.source,
  };
  setIfDefined(
    fields as Record<PropertyKey, unknown>,
    "fit",
    normalized.options.fit,
  );
  return Clip.makeMedia(definition, fields, normalized.options);
};

/** @internal */
export const withFit = (self: Image.Image, fit: Image.Fit): Image.Image =>
  Clip.withProperties(self, { fit });

/** @internal */
export const isImage = (input: unknown): input is Image.Image =>
  Clip.hasTag(input, "Image");
