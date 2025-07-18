import Runtime from "#Runtime";
import { marked } from "marked";

export default class Default extends Runtime {
  compile = {
    server: async (text: string) =>
      `export default () => ${JSON.stringify(await marked.parse(text))};`,
  };
}
