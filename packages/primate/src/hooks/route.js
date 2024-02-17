import o from "rcompat/object";
import { tryreturn } from "rcompat/sync";
import errors from "../errors.js";
import validate from "../validate.js";

// insensitive-case equal
const ieq = (left, right) => left.toLowerCase() === right.toLowerCase();

const deroot = pathname => pathname.endsWith("/") && pathname !== "/"
  ? pathname.slice(0, -1) : pathname;

export default app => {
  const { types, routes } = app;
  const location = app.get("location");

  const to_path = (route, pathname) => app.dispatch(o.from(Object
    .entries(route.pathname.exec(pathname)?.groups ?? {})
    .map(([name, value]) => [name.split("$"), value])
    .map(([[name, type], value]) =>
      [name, type === undefined ? value : validate(types[type], value, name)],
    )));

  const is_type = (groups, pathname) => Object.entries(groups ?? {})
    .filter(([name]) => name.includes("$"))
    .map(([name, value]) => [name.split("$"), value])
    .map(([[name, type], value]) =>
      tryreturn(_ => [name, validate(types[type], value, name)])
        .orelse(({ message }) => errors.MismatchedPath.throw(pathname, message)));
  const is_path = ({ route, pathname }) => {
    const result = route.pathname.exec(pathname);
    return result === null ? false : is_type(result.groups, pathname);
  };
  const is_method = ({ route, method, pathname }) => ieq(route.method, method)
    && is_path({ route, pathname });
  const find = (method, pathname) => routes.find(route =>
    is_method({ route, method, pathname }));

  const index = path => `${location.routes}${path === "/" ? "/index" : path}`;
  // remove excess slashes
  const deslash = url => url.replaceAll(/\/{2,}/gu, _ => "/");

  return ({ original: { method }, url }) => {
    const pathname = deroot(deslash(url.pathname));
    const route = find(method, pathname) ?? errors.NoRouteToPath
      .throw(method.toLowerCase(), pathname, index(pathname));
    return { ...route, path: to_path(route, pathname) };
  };
};
