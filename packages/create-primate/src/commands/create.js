import { intro, outro } from "@clack/prompts";
import blue from "@rcompat/cli/color/blue";
import resolve from "@rcompat/fs/resolve";
import same from "@rcompat/fs/same";
import * as files from "../files/exports.js";
import { Bailout } from "../prompts.js";
import run from "../run.js";

const filter = (configs, property) =>
  configs.filter(conf => conf[property] !== undefined).reduce((acc, conf) =>
    ({ ...acc, ...conf[property] }), undefined) ?? {};

const create = async ([root, configs]) => {
  const config = {
    imports: filter(configs, "imports"),
    dependencies: filter(configs, "dependencies"),
    modules: filter(configs, "modules"),
    config: filter(configs, "config"),
  };

  await files.gitignore(root, config);
  await files.package_json(root, config);
  await files.primate_config_js(root, config);
  const pages = root.join("pages");
  await pages.create();
  await files.app_html(pages);
  await files.error_html(pages);
  const routes = root.join("routes");
  await routes.create();
  await files.index_route(routes);

  return root;
};

export default async () => {
  intro("Creating a Primate app");
  try {
    const root = await create(await run());
    const cd = same(root, resolve()) ? "" : `cd ${root} && `;
    outro(blue(`done, run \`${cd}npm i && npx primate\` to start`));
  } catch (error) {
    if (error instanceof Bailout) {
      outro("bye");
    } else {
      throw error;
    }
  }
};
