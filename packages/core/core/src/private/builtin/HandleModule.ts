import route from "#request/route";
import Module from "#Module";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";

export default class HandleModule extends Module {
  name = "builtin/handle";
  #app: ServeApp;

  constructor(app: ServeApp) {
    super();

    this.#app = app;
  }

  async handle(request: RequestFacade) {
    return await this.#app.serve(request.url.pathname)
      ?? route(this.#app, request);
  }
}
