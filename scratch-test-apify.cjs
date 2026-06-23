require('dotenv').config({ path: '.env' });
const { ApifyClient } = require('apify-client');

async function main() {
  const token = process.env.APIFY_API_TOKEN;
  console.log('Token present:', !!token, 'length:', token?.length);
  const client = new ApifyClient({ token });

  const username = 'instagram'; // well-known public test handle

  try {
    console.log('Trying apify/instagram-profile-scraper...');
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [username],
    }, { waitSecs: 90 });
    console.log('Run status:', run.status, 'datasetId:', run.defaultDatasetId);
    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    console.log('Items count:', dataset.items.length);
    console.log('First item keys:', dataset.items[0] ? Object.keys(dataset.items[0]).slice(0, 20) : 'NONE');
    console.log('First item error field:', dataset.items[0]?.error, dataset.items[0]?.errorDescription);
  } catch (e) {
    console.error('PROFILE SCRAPER FAILED:', e.message);
    console.error('type:', e.type || '', 'statusCode:', e.statusCode || '');
  }
}

main();
