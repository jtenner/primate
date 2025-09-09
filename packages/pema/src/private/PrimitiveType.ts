import CoerceKey from "#CoerceKey";
import error from "#error";
import type Infer from "#Infer";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import Type from "#Type";
import type Validator from "#Validator";
import type JSONPointer from "@rcompat/type/JSONPointer";
import type Newable from "@rcompat/type/Newable";

type Next<T> = {
  options?: ParseOptions;
  validators?: Validator<T>[];
};

export default abstract class PrimitiveType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #validators: Validator<StaticType>[];
  #options: ParseOptions;

  constructor(
    validators: Validator<StaticType>[] = [],
    options: ParseOptions = {},
  ) {
    super();
    this.#validators = validators;
    this.#options = options;
  }

  get options() {
    return this.#options;
  }

  get validators() {
    return this.#validators;
  }

  derive(next: Next<StaticType>): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(
      [...this.#validators, ...next.validators ?? []],
      { ...this.#options, ...next.options ?? {} },
    );
  }

  get coerce() {
    return this.derive({ options: { coerce: true } });
  }

  parse(x: unknown, options: ParseOptions<StaticType> = {}): Infer<this> {
    const $options: ParseOptions<StaticType> = { ...this.#options, ...options };
    const validators = [...$options.validators ?? [], ...this.#validators];
    const $x = $options.coerce === true ? this[CoerceKey](x) : x;

    if (typeof $x !== this.name) {
      throw new ParseError(error(this.name, $x, $options));
    }
    const base = $options[ParsedKey] ?? "";

    for (const v of validators) {
      try {
        v($x as StaticType);
      } catch (e) {
        if (e instanceof ParseError) {
          // rebase each issue path under `base`
          const rebased = (e.issues ?? []).map(i => ({
            ...i,
            path: i.path === ""
              ? base
              : (base === "" ? i.path : (base + i.path) as JSONPointer),
          }));
          throw new ParseError(rebased);
        }
        // non a ParseError - wrap with proper path
        const message = e && typeof (e as any).message === "string"
          ? (e as any).message
          : String(e);
        throw new ParseError([{
          input: x,
          message,
          path: base,
        }]);
      }

    }
    return $x as never;
  }
}
