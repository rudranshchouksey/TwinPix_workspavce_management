# AI Integration

TwinPix Workspace leverages Artificial Intelligence to drastically reduce manual data analysis and optimize influencer marketing campaigns.

## ChatGPT Integration

The core intelligence of the platform is powered by the OpenAI SDK (ChatGPT-4o). It is heavily utilized for natural language processing and data summarization.

## Prompt Flow & Data Processing

1. **Data Aggregation**: When an AI action is requested, the system aggregates relevant data from PostgreSQL (e.g., an influencer's historical performance, recent posts, and category).
2. **Contextual Prompting**: The aggregated data is injected into highly tuned, system-level prompts that enforce structured output.
3. **Structured Response**: OpenAI returns structured JSON detailing specific metrics, which are then parsed and stored securely in the database.

## AI Assistant (Copilot)

The Copilot is an interactive chat interface accessible throughout the workspace.
- **Purpose**: Allows users to query workspace data naturally (e.g., "Which influencers have an engagement rate over 5%?").
- **Implementation**: Utilizes OpenAI's streaming API (`/api/copilot/chat`) to provide real-time, conversational responses based on the user's specific context and RBAC permissions.

## Creator Intelligence & Brand Matching

Two dedicated models manage AI outputs:
- **CreatorAIInsights**: Automatically generates a profile of an influencer's strengths, weaknesses, and a Brand Safety Score based on their content history.
- **BrandMatchAnalysis**: Scores how well a specific influencer aligns with a Campaign's target demographic and deliverables.

## Instagram Sync

While not purely LLM-based, the AI ecosystem relies on fresh data.
- The platform uses **Apify** to scrape public Instagram data (Posts, Reels, Followers) via a chron-triggered webhook (`/api/instagram/sync`).
- This raw data feeds directly into the AI models to ensure insights are up-to-date.

## Future AI Roadmap

- **AI Project Manager**: Predictive task routing and bottleneck identification.
- **Automated Outreach**: Hyper-personalized initial outreach email/DM generation based on the influencer's recent content.
- **Sentiment Analysis**: Analyzing comment sections of delivered posts to gauge public reaction automatically.
