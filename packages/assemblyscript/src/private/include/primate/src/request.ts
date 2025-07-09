import BufferView from "./bufferview";
import { receiveBytes } from "./external";

export abstract class BodyMapElement {}

export class BodyMapElementString extends BodyMapElement {
  constructor(
    public value: string,
  ) {
    super();
  }
}

export class BodyMapElementBytes extends BodyMapElement {
  constructor(
    public value: Uint8Array,
  ) {
    super();
  }
}

export abstract class Body {}

export class BodyString extends Body {
  constructor(
    public value: string,
  ) {
    super();
  }
}

export class BodyMap extends Body {
  constructor(
    public values: Map<string, BodyMapElement>,
  ) {
    super();
  }
}

const URI_SECTION = u32(0)
const BODY_SECTION = u32(1)
const PATH_SECTION = u32(2)
const QUERY_SECTION = u32(3)
const HEADERS_SECTION = u32(4)
const COOKIES_SECTION = u32(5)

const BODY_NULL = u32(0)
const BODY_MAP_ELEMENT_KIND_STRING = u32(0)
const BODY_MAP_ELEMENT_KIND_BYTES = u32(1)


function readString(buffer: BufferView): string {
  const size = buffer.readU32();
  return buffer.read(size);
}

function getSectionMap(kind: u32, buffer: BufferView): Map<string, string> {
  const section = buffer.readU32();
  assert(section == kind, "Invalid Request Encoding.");

  const count = buffer.readU32();
  const map = new Map<string, string>();
  for (let i = u32(0); i < count; i++) {
    const key = readString(buffer);
    const value = readString(buffer);
    map.set(key, value);
  }

  return map;
}

function getBodyMapElement(buffer: BufferView): BodyMapElement {
  const kind = buffer.readU32();

  switch (kind) {
    case u32(0): {
      const str = readString(buffer);
      return new BodyMapElementString(str);
    }
    case u32(1): {
      const size = i32(buffer.readU32());
      const bytes = buffer.readBytes(size)
      return new BodyMapElementBytes(bytes);
    }
  }
}

function getBodyMap(buffer: BufferView): Map<string, BodyMapElement> {
  const count = buffer.readU32();
  const map = new Map<string, BodyMapElement>();
  for (let i = u32(0); i < count; i++) {
    const key = readString(buffer);
    const value = getBodyMapElement(buffer);
    map.set(key, value);
  }

  return map;
}

function getBody(buffer: BufferView): Body | null {
  const kind = buffer.readU32();

  switch (kind) {
    case u32(0): return null;
    case u32(1): {
      const str = readString(buffer);
      return new BodyString(str);
    }
    case u32(2): {
      const map = getBodyMap(buffer);
      return new BodyMap(map);
    }
    default: assert(false, "Invalid Request Encoding.");
  }
}

class Request {
  url: string;
  body: Body | null;
  path: Map<string, string> = new Map<string, string>();
  query: Map<string, string> = new Map<string, string>();
  headers: Map<string, string> = new Map<string, string>();
  cookies: Map<string, string> = new Map<string, string>();

  constructor() {
    const payload = receiveBytes();
    const buffer = new BufferView(payload);

    const header0 = buffer.readU32();
    assert(header0 == URI_SECTION, "Invalid Request Encoding");

    const url = readString(buffer);

    const header1 = buffer.readU32();
    assert(header0 == BODY_SECTION, "Invalid Request Encoding");

    const body = getBody(buffer);

    const path = getSectionMap(PATH_SECTION, buffer);
    const query = getSectionMap(QUERY_SECTION, buffer);
    const headers = getSectionMap(HEADERS_SECTION, buffer);
    const cookies = getSectionMap(COOKIES_SECTION, buffer);

    this.url = url;
    this.body = body;
    this.path = path;
    this.query = query;
    this.headers = headers;
    this.cookies = cookies;
  }
}

export default Request;