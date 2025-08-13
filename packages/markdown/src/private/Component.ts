import type Dict from "@rcompat/type/Dict";

type Component = {
  html: string;
  meta: Dict | null;
  toc: {
    depth: number;
    slug: string;
    text: string;
  }[];
};

export type { Component as default };
