import CoerceKey from "#CoerceKey";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";

export default abstract class Parsed<StaticType> {
  get [ParsedKey]() {
    return "ParsedKey" as const;
  }

  get infer() {
    return undefined as StaticType;
  }

  get nullable() {
    return false;
  }

  [CoerceKey](x: unknown) {
    return x;
  }

  abstract get name(): string;

  /**
  * Parse the given value.
  *
  * @param x Value to parse.
  *
  * @throws `ParseError` if the value could not be parsed.
  *
  * @returns The parsed value, if successfully parsed.
  */
  abstract parse(x: unknown, options?: ParseOptions): StaticType;
}
