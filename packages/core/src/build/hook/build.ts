import { symbols, type BuildApp } from "#build/app";
import config_filename from "#config-filename";
import log from "@primate/core/log";
import cascade from "@rcompat/async/cascade";
import dim from "@rcompat/cli/color/dim";
import FileRef from "@rcompat/fs/FileRef";
import manifest from "@rcompat/package/manifest";
import root from "@rcompat/package/root";
import type Dictionary from "@rcompat/type/Dictionary";
import stringify from "@rcompat/record/stringify";
import copy_includes from "./copy-includes.js";
import $router from "./router.js";

const pre = async (app: BuildApp, target: string) => {
  let target$ = target;
  if (app.targets[target] === undefined) {
    throw new Error(`target ${dim(target)} does not exist`);
  }
  if (app.targets[target].forward !== undefined) {
    target$ = app.targets[target].forward;
  }
  app.build_target = target$;
  log.system(`starting ${dim(target$)} build in ${dim(app.mode)} mode`);

  // remove build directory in case exists
  await app.path.build.remove();
  await app.path.build.create();

  await Promise.all(["server", "client", "components"]
    .map(directory => app.runpath(directory).create()));

  return app;
};

const js_re = /^.*.js$/;
const write_directories = async (build_directory: FileRef, app: BuildApp) => {
  for (const name of app.server_build) {
    const d = app.runpath(`${name}s`);
    const e = await Promise.all((await FileRef.collect(d, file => js_re.test(file.path)))
      .map(async path => `${path}`.replace(d.toString(), _ => "")));
    const files_js = `
    const ${name} = [];
    ${e.map(path => path.slice(1, -".js".length)).map((bare, i) =>
    `import * as ${name}${i} from "${FileRef.webpath(`#${name}/${bare}`)}";
    ${name}.push(["${FileRef.webpath(bare)}", ${name}${i}]);`,
  ).join("\n")}
    export default ${name};`;
    await build_directory.join(`${name}s.js`).write(files_js);
  }
};

const write_components = async (build_directory: FileRef, app: BuildApp) => {
  const location = app.config("location");
  const d2 = app.runpath(location.server, location.components);
  const e = await Promise.all((await FileRef.collect(d2, file => js_re.test(file.path)))
    .map(async path => `${path}`.replace(d2.toString(), _ => "")));
  const components_js = `
const components = [];
${e.map((component, i) =>
    `import * as component${i} from "${FileRef.webpath(`../server/components${component}`)}";
components.push(["${FileRef.webpath(component.slice(1, -".js".length))}", component${i}]);`,
  ).join("\n")}

${app.roots.map((root, i) => `
import * as root${i} from "${FileRef.webpath(`../server/${root.name}`)}";
components.push(["${root.name}", root${i}]);
`).join("\n")}

export default components;`;
  await build_directory.join("components.js").write(components_js);
};

const write_bootstrap = async (build_number: string, app: BuildApp, mode: string) => {
  const build_start_script = `
import serve from "primate/serve";
import config from "./${config_filename}";
const files = {};
${app.server_build.map(name => `${name}s`).map(name =>
    `import ${name} from "./${build_number}/${name}.js";
     files.${name} = ${name};`,
  ).join("\n")}
import components from "./${build_number}/components.js";
import target from "./target.js";
import session from "#session";
import s_config from "primate/symbol/config";

const app = await serve(import.meta.url, {
  ...target,
  config,
  files,
  components,
  mode: "${mode}",
  session_config: session[s_config],
});

export default app;
`;
  await app.path.build.join("serve.js").write(build_start_script);
};

const post = async (app: BuildApp) => {
  const router = await $router(app.path.routes, Object.keys(app.bindings));
  app.set(symbols.layout_depth, router.depth("layout"));

  const location = app.config("location");
  const defaults = FileRef.join(import.meta.url, "../../defaults");

  await app.stage2(app.path.routes, "routes", file =>
    `export { default } from "#stage/route${file}";`);

  await app.stage2(app.path.stores, "stores", file =>
    `import db from "#db";
import store from "#stage/store${file}";

export default db.wrap("${file.base}", store);`);

  const internal_config_path = FileRef
   .join(import.meta.dirname, "../../private/config");

  await app.stage2(internal_config_path, "config", file =>
    `export { default } from "#stage/config${file}";`);

  await app.stage2(app.path.config, "config", file =>
    `export { default } from "#stage/config${file}";`);

  const { define = {} } = app.config("build");
  const defines = Object.entries(define);
  // stage components, transforming defines
  await app.stage(app.path.components, location.components, text =>
    defines.reduce((replaced, [key, substitution]) =>
      replaced.replaceAll(key, substitution as string), text));

  // copy framework pages
  await app.stage(defaults, FileRef.join(location.server, location.pages));
  // overwrite transformed pages to build
  await app.stage(app.path.pages, FileRef.join(location.server, location.pages));

  // copy static files to build/server/static
  await app.stage(app.path.static, FileRef.join(location.server, location.static));

  // publish JavaScript and CSS files
  const imports = await FileRef.collect(app.path.static, file => /\.(?:css)$/.test(file.path));
  await Promise.all(imports.map(async file => {
    const src = file.debase(app.path.static);
    app.build.export(`import "./${location.static}${src}";`);
  }));

  // copy additional subdirectories to build/server
  await copy_includes(app, location.server);

  const components = await app.runpath(location.components).collect();

  // from the build directory, compile to server and client
  await Promise.all(components.map(component => app.compile(component)));

  // start the build
  await app.build.start();

  // a target needs to create an `assets.js` that exports assets
  await app.targets[app.build_target]?.target(app);

  const build_number = crypto.randomUUID().slice(0, 8);
  const build_directory = app.path.build.join(build_number);
  // TODO: remove after rcompat automatically creates directories
  await build_directory.create();

  await write_components(build_directory, app);
  await write_directories(build_directory, app);
  await write_bootstrap(build_number, app, app.mode);

  // copy config file
  const local_config = app.root.join(config_filename);
  const build_config = app.path.build.join(config_filename);

  const root_base = await root(import.meta.url);
  const default_config = root_base.join("/src/private/config.js");
  (await local_config.exists() ? local_config : default_config)
    .copy(build_config);

  const manifest_data = {
    ...await manifest() as Dictionary,
    imports: {
      "#locale/*": "./locales/*.js",
      "#route/*": "./routes/*.js",
      "#stage/route/*": "./stage/routes/*.js",
      "#store/*": "./stores/*.js",
      "#stage/store/*": "./stage/stores/*.js",
      "#stage/config/*": "./stage/config/*.js",
      "#component/*": "./components/*.js",
      "#db": "./config/db.js",
      "#session": "./config/session.js",
    },
  };
  // create package.json
  const package_json = "package.json";
  await app.path.build.join(package_json).write(stringify(manifest_data));

  log.system(`build written to ${dim(app.path.build.toString())}`);

  app.postbuild.forEach(fn => fn());
};

export default async (app: BuildApp, target = "web") =>
  post(await (app.modules.build === undefined
    ? app
    : await cascade(app.modules.build)(await pre(app, target))));
