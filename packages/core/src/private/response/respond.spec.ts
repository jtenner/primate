import respond from "#response/respond";
import TEXT_HTML from "@rcompat/http/mime/text/html";
import Status from "@rcompat/http/Status";
import test from "@rcompat/test";

const app = {
  respond(body: any, { headers = {}, status = Status.OK } = {}) {
    return new Response(body, {
      headers: {
        "content-type": TEXT_HTML, ...headers,
      },
      status,
    });
  },
};

const url = "https://primate.run/";
const status = Status.FOUND;

test.case("guess URL", async assert => {
  const response = await (respond(new URL(url)) as any)(app)!;
  // assert(await response.text()).null();
  assert(response.status).equals(status);
  assert(response.headers.get("location")).equals(url);
});
