import { File } from "rcompat/fs";
import Logger from "./Logger.js";

const json = await new File(import.meta.url).up(1).join("errors.json").json();

const errors = Logger.err(json.errors, json.module);

export default errors;
