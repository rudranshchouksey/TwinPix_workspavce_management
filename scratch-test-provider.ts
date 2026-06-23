import "dotenv/config";
import { ApifyProvider } from "./src/services/instagram/apify-provider";

async function main() {
  const provider = new ApifyProvider();
  const data = await provider.fetchInfluencerData("instagram");
  console.log("PROFILE:", JSON.stringify(data.profile, null, 2));
  console.log("POSTS COUNT:", data.posts.length);
  console.log("REELS COUNT:", data.reels.length);
  console.log("SAMPLE POST:", JSON.stringify(data.posts[0], null, 2));
}

main().catch((e) => {
  console.error("FAILED:", e);
});
