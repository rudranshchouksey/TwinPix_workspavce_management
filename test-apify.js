require('dotenv').config();
const { ApifyClient } = require('apify-client');

async function main() {
  const token = process.env.APIFY_API_TOKEN;
  console.log("Token:", token ? "Found" : "Missing");
  
  if (!token) return;
  
  const client = new ApifyClient({ token });
  
  try {
    console.log("Starting Apify run...");
    const run = await client.actor("apify/instagram-scraper").call({
      username: ["therock"],
      resultsLimit: 2
    });
    
    console.log("Run finished. Dataset ID:", run.defaultDatasetId);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Found ${items.length} items`);
    
  } catch (e) {
    console.error("Apify Error:", e.message);
  }
}

main();
