import { File } from "rcompat/fs";
import { Logger } from "primate";

const json = await new File(import.meta.url).up(1).join("errors.json").json();

export default Logger.err(json.errors, json.module);
