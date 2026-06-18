import { Page } from "playwright";

export interface InstagramProfileData {
  username: string;
  fullName: string;
  bio: string;
  profileImageUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  externalUrl?: string;
  isVerified: boolean;
  businessEmail?: string;
  businessPhoneNumber?: string;
}

/**
 * Scrapes an Instagram profile for basic information and metrics.
 */
export async function scrapeProfile(page: Page, handle: string): Promise<InstagramProfileData | null> {
  const url = `https://www.instagram.com/${handle}/`;
  
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    
    // Check if we hit a login wall or are blocked
    const pageTitle = await page.title();
    if (pageTitle.toLowerCase().includes("log in") || await page.$("input[name='username']")) {
      console.warn(`[Scraper] Login wall hit for @${handle}`);
      // Throw error or handle auth logic here
      return null;
    }

    // Wait for the main profile header to load
    await page.waitForSelector("header", { timeout: 10000 }).catch(() => null);

    // Instead of complex DOM selectors which change frequently, 
    // we attempt to intercept the GraphQL responses or `_sharedData` script if available.
    // For this architecture demo, we use heuristic DOM scraping as a fallback.
    
    // Bio
    const bioElement = await page.$("header section h1 + div span");
    const bio = bioElement ? await bioElement.innerText() : "";
    
    // Full Name
    const nameElement = await page.$("header section h1 + div span:first-child"); // Varies widely
    const fullName = nameElement ? await nameElement.innerText() : handle;

    // Stats (Posts, Followers, Following)
    const statElements = await page.$$("header section ul li span span, header section ul li span");
    let postsCount = 0;
    let followersCount = 0;
    let followingCount = 0;

    if (statElements.length >= 3) {
      const postsText = await statElements[0].innerText();
      const followersText = await statElements[1].innerText();
      const followingText = await statElements[2].innerText();

      postsCount = parseNumber(postsText);
      followersCount = parseNumber(followersText);
      followingCount = parseNumber(followingText);
    }

    // Profile Image
    const imgElement = await page.$("header img");
    const profileImageUrl = imgElement ? await imgElement.getAttribute("src") : "";

    return {
      username: handle,
      fullName: fullName || handle,
      bio: bio || "",
      profileImageUrl: profileImageUrl || "",
      followersCount,
      followingCount,
      postsCount,
      isVerified: false, // Would require checking for the verified badge SVG
    };

  } catch (error) {
    console.error(`[Scraper] Error scraping profile @${handle}:`, error);
    return null;
  }
}

function parseNumber(str: string): number {
  if (!str) return 0;
  let cleanStr = str.replace(/,/g, '').toUpperCase();
  let multiplier = 1;
  
  if (cleanStr.includes('K')) {
    multiplier = 1000;
    cleanStr = cleanStr.replace('K', '');
  } else if (cleanStr.includes('M')) {
    multiplier = 1000000;
    cleanStr = cleanStr.replace('M', '');
  }
  
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : Math.floor(parsed * multiplier);
}
