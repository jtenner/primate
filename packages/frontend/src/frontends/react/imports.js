import { File } from "rcompat/fs";
import o from "rcompat/object";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import esbuild from "esbuild";
import { expose } from "./client/exports.js";

export const render = (component, props) => {
  const heads = [];
  const push_heads = sub_heads => {
    heads.push(...sub_heads);
  };
  const body = renderToString(createElement(component, { ...props, push_heads }));
  if (heads.filter(head => head.startsWith("<title")).length > 1) {
    const error = "May only contain one <title> across component hierarchy";
    throw new Error(error);
  }
  const head = heads.join("\n");

  return { body, head };
};

const options = { loader: "jsx", jsx: "automatic" };
export const compile = {
  async server(text) {
    return (await esbuild.transform(text, options)).code;
  },
  async client(text) {
    return { js: (await esbuild.transform(text, options)).code };
  },
};

export const prepare = async app => {
  const to_path = path => new File(import.meta.url).up(1).join(...path);
  const { library } = app;
  const module = "react";
  const $base = ["client", "imports"];
  const index = $base.concat("index.js");
  const imports = {
    react: "react.js",
    "react-dom/client": "react-dom.js",
    "react/jsx-runtime": "jsx-runtime.js",
  };

  const target = app.runpath(app.get("location.client"), app.library, module);
  await esbuild.build({
    entryPoints: [`${to_path(index)}`],
    bundle: true,
    format: "esm",
    outdir: `${target}`,
  });
  await target.create();
  await Promise.all(Object.values(imports).map(async value =>
    target.join(value).write(await to_path($base.concat(value)).text())));

  app.importmaps = {
    ...app.importmaps,
    ...o.valmap(imports, value =>
      File.join("/", library, module, value).webpath()),
  };

  await app.import("@primate/frontend", "react");
  // expose code through "app", for bundlers
  await app.export({ type: "script", code: expose });
};
