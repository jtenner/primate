import build from "#build";
import default_extension from "#extension";
import pkgname from "#pkgname";
import which from "@rcompat/stdio/which";
import type ASPluginConfig from "./ASPluginConfig.ts";

export default async (props = {} as Partial<ASPluginConfig>) => {
  const effectiveConfig: ASPluginConfig = {
    command: props.command ?? await which("asc"),
    extension: props.extension ?? default_extension,
    asconfig: props.asconfig ?? "./asconfig.json",
  };

  return {
    name: pkgname,
    build: build(effectiveConfig),
  };
} 
  
