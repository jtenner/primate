import Request from "primate/request";
// @ts-ignore: This library exists in assemblyscript land
import { __pin, __unpin } from "rt/tcms";

export function newRequest(): Request {
  const req = new Request()
  __pin(changetype<usize>(req));
  return req;
}

export function finalizeRequest(req: usize): void {
  __unpin(req);
}

export function sendResponse(res: usize) {

}