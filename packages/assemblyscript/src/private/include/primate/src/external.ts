import { JSON } from "@devcycle/assemblyscript-json";
import BufferView from "./bufferview";

// @ts-expect-error: abi
@external("primate", "receive")
export declare function receive(ptr: usize, size: i32): void;

// @ts-expect-error: abi
@external("primate", "payloadByteLength")
export declare function payloadByteLength(): i32;

// @ts-expect-error: abi
@external("primate", "send")
export declare function send(ptr: usize, size: i32): void;

// @ts-expect-error: abi
@external("primate", "newSession")
export declare function newSession(): void;

// @ts-expect-error: abi
@external("primate", "getSession")
export declare function getSession(): void;

// @ts-expect-error: abi
@external("primate", "websocketSend")
export declare function websocketSend(): void;

// @ts-expect-error: abi
@external("primate", "websocketClose")
export declare function websocketClose(): void;

export function receiveString(): string {
  const size = payloadByteLength();
  const ptr = new ArrayBuffer(size);
  receive(changetype<usize>(ptr), size);

  const view = new BufferView(ptr);
  const strSize = i32(view.readU32());
  return view.read(strSize);
}

export function receiveBytes(): Uint8Array {
  const size = payloadByteLength();
  const ptr = new ArrayBuffer(size);
  receive(changetype<usize>(ptr), size);
  return Uint8Array.wrap(ptr);
}

export function receiveJson(): JSON.Value {
  const buffer = receiveBytes();
  return JSON.parse(buffer);
}

export function sendString(str: string): void {
  const ptr = String.UTF8.encode(str);
  const byteLength = ptr.byteLength;
  send(changetype<usize>(ptr), byteLength);
}

export function sendBytes(buffer: Uint8Array): void {
  const ptr = changetype<usize>(buffer.buffer)
    + usize(buffer.byteOffset);
  const byteLength = buffer.byteLength;

  send(ptr, byteLength);
}

export function sendJson(json: JSON.Value): void {
  const str = json.stringify();
  sendString(str);
}
