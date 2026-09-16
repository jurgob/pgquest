import { readServerConfig } from "../config/config.server";

export async function loader() {
  const config = await readServerConfig();
  const pingUrl = config.healthcheck.pingUrl;
  const pinged = pingUrl ? await pingHealthcheck(pingUrl) : false;

  return Response.json({ status: "ok", pinged });
}

async function pingHealthcheck(pingUrl: string) {
  try {
    await fetch(pingUrl);
    return true;
  } catch {
    return false;
  }
}
