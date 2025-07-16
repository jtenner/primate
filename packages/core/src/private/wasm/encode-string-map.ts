import type PartialDict from "@rcompat/type/PartialDict";
import encodeString from "./encode-string.js";
import type BufferView from "@rcompat/bufferview";

const encodeStringMap = (map: PartialDict<string>, bufferView: BufferView) => {
  // only "set" entries are allowed
  const entries = Object.entries(map).filter(([, value]) => value && value.length > 0);
  const count = entries.length;

  bufferView.writeU32(count);

  for (const [key, value] of entries) {
    encodeString(key, bufferView);
    encodeString(value!, bufferView);
  }
};

export default encodeStringMap;
