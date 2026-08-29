// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore OpenNext generates this module before Wrangler bundles this entrypoint.
import openNextHandler from "./.open-next/worker.js";
import { DEFAULT_ROOM_CODE } from "./lib/demo-state";

export { ClassroomRoom } from "./worker/classroom-room";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/live") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected a WebSocket upgrade", { status: 426 });
      }
      const requestedRoom = (url.searchParams.get("room") ?? DEFAULT_ROOM_CODE).toUpperCase();
      const room = /^[A-Z0-9-]{1,20}$/.test(requestedRoom) ? requestedRoom : DEFAULT_ROOM_CODE;
      const stub = env.CLASSROOM_ROOM.getByName(room);
      return stub.fetch(request);
    }
    return openNextHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<CloudflareEnv>;
