import closeWithGrace from "close-with-grace";
import { setupServer } from "msw/node";
import { handlers as pwnedPasswordApiHandlers } from "./pwned-passwords.ts";
import { handlers as resendHandlers } from "./resend.ts";
import { handlers as tigrisHandlers } from "./tigris.ts";

export const server = setupServer(
  ...resendHandlers,
  ...tigrisHandlers,
  ...pwnedPasswordApiHandlers,
);

server.listen({
  onUnhandledRequest(request, print) {
    // React-router-devtools send custom requests internally to handle some functionality, we ignore those
    if (request.url.includes("__rrdt")) {
      return;
    }
    // Print the regular MSW unhandled request warning otherwise.
    print.warning();
  },
});

if (process.env.NODE_ENV !== "test") {
  console.info("🔶 Mock server installed");

  closeWithGrace(() => {
    server.close();
  });
}
