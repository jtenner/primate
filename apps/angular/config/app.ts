import config from "primate/config";
import angular from "@primate/angular";

export default config({
  modules: [angular()],
  http: {
    port: 10000,
  },
});
