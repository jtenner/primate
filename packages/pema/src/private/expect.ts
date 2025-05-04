const types = {
  a: "array",
  b: "boolean",
  d: "date",
  n: "number",
  s: "string",
  u: "undefined",
  bt: "bigint",
  f: "file",
  bb: "blob",
  o: "object",
  nl: "null",
  sy: "symbol",
  ur: "url",
};

const prefix = (at: string) => at ? `${at}: `: "";

export default (type: keyof typeof types, got: unknown, at = "") =>
  `${prefix(at)}expected ${types[type]}, got \`${got}\` (${typeof got})`;
