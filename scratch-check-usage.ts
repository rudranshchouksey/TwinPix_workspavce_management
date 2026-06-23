import "dotenv/config";

async function main() {
  const token = process.env.APIFY_API_TOKEN;
  const res = await fetch("https://api.apify.com/v2/users/me/usage/monthly", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  console.log(res.status);
  console.log(JSON.stringify(json, null, 2));
}
main().catch((e) => console.error("ERR:", e.message));
