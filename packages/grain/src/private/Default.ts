import Runtime from "#Runtime";
import execute from "@rcompat/stdio/execute";
import assert from "@rcompat/assert";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";
import FileRef from "@rcompat/fs/FileRef";
import type Mode from "@primate/core/Mode";

const dirname = import.meta.dirname;
const postlude_file = FileRef.join(dirname, "bootstrap", "postlude.gr");
const bootstrap_file = FileRef.join(dirname, "bootstrap", "index.js");

export default class Default extends Runtime {
  #command(wasm: FileRef, grain: FileRef, mode: Mode) {
    const config = this.config;

    const includeDirs = new Set(config.includeDirs ?? []);
    includeDirs.add(FileRef.join(dirname, "include").path);

    const sections = [
      config.command,
      "compile",
      "-o", wasm.name,
      grain.name,
      "-I", [...includeDirs].join(","),
    ];

    if (config.stdlib) {
      sections.push("-S", config.stdlib);
    }

    if (mode === "development") {
      sections.push("--debug", "--wat");
    } else {
      sections.push("--release");
    }

    if (config.noPervasives) {
      sections.push("--no-pervasives");
    }

    if (config.strictSequence) {
      sections.push("--strict-sequence");
    }

    return sections.join(" ");
  }

  build(app: BuildApp, next: NextBuild) {
    app.bind(this.extension, async (route, context) => {
      assert(context === "routes", "grain: only route files are supported");

      const text = await route.text();
      const postlude = await postlude_file.text();
      await route.write(`${text}\n${postlude}`);
      const wasm = route.bare(".wasm");
      const command = this.#command(wasm, route, app.mode);
      await execute(command , { cwd: `${route.directory}` });

      const code = (await bootstrap_file.text()).replace("__FILE_NAME__",
        wasm.path);
      await route.bare(".gr.js").write(code);
    });

    return next(app);
  }
}
