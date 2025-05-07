import type SessionData from "#session/Data";
import local_storage from "./storage.js";

const session = () => local_storage.getStore()!;

export default {
  get new(): boolean {
    return session().new;
  },
  get id(): string {
    return session().id;
  },
  get data(): SessionData | undefined {
    return session().data;
  },
  create(data?: SessionData): void {
    return session().create(data);
  },
  destroy(): void {
    return session().destroy();
  },
};
