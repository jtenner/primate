import html from "@primate/html";
import config from "primate/config";

export default config({
  modules: [html()],
  http: {
    port: 10010,
  },
});
