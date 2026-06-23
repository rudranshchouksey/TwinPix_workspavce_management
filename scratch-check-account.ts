import "dotenv/config";
import { ApifyClient } from "apify-client";

async function main() {
  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
  const user = await client.user().get();
  console.log(JSON.stringify(user, null, 2));
}
main().catch((e) => console.error("ERR:", e.message, e.statusCode));
