import type Props from "@primate/core/frontend/Props";

const to_hyphen = (x: string) => x.replaceAll("/", "-");

export default (name: string, props: Props) => `
  import * as components from "app";

  globalThis.customElements.define("p-wrap-with", class extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: "open" });

      const id = this.getAttribute("id");
      const wrapped = globalThis.registry[id];
      this.shadowRoot.appendChild(wrapped);
      wrapped.render();
      delete globalThis.registry[id];
    }
  });
  globalThis.registry = {};

  const element = globalThis.document.createElement("${to_hyphen(name)}");
  element.props = ${JSON.stringify(props)};
  globalThis.document.body.appendChild(element)
`;
