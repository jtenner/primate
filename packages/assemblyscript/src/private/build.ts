import assert from "@rcompat/assert";
import execute from "@rcompat/stdio/execute";
import FileRef from "@rcompat/fs/FileRef";
import type { BuildAppHook } from "@primate/core/hook";
import type ASPluginConfig from "../ASPluginConfig.ts";

const _dirname = import.meta.dirname;

const asBootstrap = FileRef.join(_dirname, "bootstrap", "index.js");
const abi = FileRef.join(_dirname, "bootstrap", "abi.as");

export default (config: ASPluginConfig): BuildAppHook => (app, next) => {
  const compileASCFileCommand = (wasm: FileRef, as: FileRef, abi: FileRef) => {
    const commandSections = [
      as.path,
      abi.path,
      config.command,
      "--config",
      config.asconfig,
      "--outFile",
      wasm.path,
    ] as string[];
    if (app.mode === "development") {
      commandSections.push(
        "--target",
        "debug",
      );
    }

    if (app.mode === "production") {
      commandSections.push("--target", "release");
    }

    return commandSections.join(" ");
  }
  
  app.bind(config.extension, async (as, context) => {
    assert(context === "routes", "assemblyscript: only route files are supported");
    
    const code = await as.text();
    
    
    await as.write(code);
    const wasm = as.bare(".wasm");
    const commandText = compileASCFileCommand(wasm, as, abi);
    await execute(commandText, { cwd: `${as.directory}` });
    // TODO: Add stores folder
    // const storesFolderRef = app.root.join("stores");
    
    const bootstrapFile = as.bare(".as.js");
    const bootstrapCode = (await asBootstrap.text())
      .replace("__FILE_NAME__", wasm.path);
    await bootstrapFile.write(bootstrapCode);
  });

  return next(app);
};