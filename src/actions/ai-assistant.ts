"use server";

import OpenAI from "openai";

// Optional: Use if OPENAI_API_KEY is defined
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

const isSimulated = !process.env.OPENAI_API_KEY;

// Helper to delay simulation to feel like AI generation
const simulateDelay = () => new Promise((resolve) => setTimeout(resolve, 1500));

export async function generateTaskDescriptionAction(title: string, context?: string) {
  if (isSimulated) {
    await simulateDelay();
    return `### Overview\nThis task is to execute on the "${title}" initiative.\n\n### Objectives\n- Ensure all deliverables are met.\n- Coordinate with stakeholders.\n\n### Context\n${context || "No additional context provided."}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert product manager. Write a concise, professional task description." },
        { role: "user", content: `Write a description for a task titled "${title}". ${context ? `Context: ${context}` : ""}` }
      ],
      model: "gpt-4-turbo-preview",
    });
    return completion.choices[0].message.content || "";
  } catch (e: any) {
    console.error(e);
    return "Failed to generate description due to API error.";
  }
}

export async function improveDescriptionAction(description: string) {
  if (isSimulated) {
    await simulateDelay();
    return `### Enhanced Description\n${description}\n\n*Note: This description has been polished for clarity and actionability.*`;
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert editor. Improve the following task description to be more professional, structured, and clear. Format in markdown." },
        { role: "user", content: description }
      ],
      model: "gpt-4-turbo-preview",
    });
    return completion.choices[0].message.content || "";
  } catch (e: any) {
    return description;
  }
}

export async function generateChecklistAction(title: string, description: string) {
  if (isSimulated) {
    await simulateDelay();
    if (title.toLowerCase().includes("influencer") || title.toLowerCase().includes("campaign")) {
      return ["Research", "Creator Selection", "Budget Approval", "Contract", "Content Review", "Final Delivery"];
    }
    return ["Initial Review", "Draft Proposal", "Stakeholder Feedback", "Final Execution", "Quality Assurance"];
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a task management AI. Output a JSON array of string checklist items for the given task. Return ONLY the JSON array." },
        { role: "user", content: `Task: ${title}\nDesc: ${description}` }
      ],
      model: "gpt-3.5-turbo",
    });
    const result = completion.choices[0].message.content || "[]";
    return JSON.parse(result) as string[];
  } catch (e) {
    return ["Initial Review", "Execution", "Quality Assurance"];
  }
}

export async function generateSubtasksAction(title: string, description: string) {
  // Returns string array of subtask titles
  return generateChecklistAction(title, description); 
}

export async function suggestPriorityAction(title: string, description: string) {
  if (isSimulated) {
    await simulateDelay();
    const t = title.toLowerCase();
    if (t.includes("urgent") || t.includes("asap") || t.includes("critical") || t.includes("hotfix")) return "URGENT";
    if (t.includes("campaign") || t.includes("launch")) return "HIGH";
    if (t.includes("update") || t.includes("fix")) return "MEDIUM";
    return "LOW";
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a task management AI. Suggest a priority (URGENT, HIGH, MEDIUM, LOW) for the task. Return ONLY the word." },
        { role: "user", content: `Task: ${title}\nDesc: ${description}` }
      ],
      model: "gpt-3.5-turbo",
    });
    const result = completion.choices[0].message.content?.trim().toUpperCase();
    if (["URGENT", "HIGH", "MEDIUM", "LOW"].includes(result || "")) return result as any;
    return "MEDIUM";
  } catch (e) {
    return "MEDIUM";
  }
}

export async function estimateTimeAction(title: string, description: string) {
  if (isSimulated) {
    await simulateDelay();
    const t = title.toLowerCase();
    if (t.includes("campaign")) return 40;
    if (t.includes("design")) return 16;
    if (t.includes("fix")) return 2;
    return 8;
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an engineering manager. Estimate the hours needed for this task. Return ONLY a number." },
        { role: "user", content: `Task: ${title}\nDesc: ${description}` }
      ],
      model: "gpt-3.5-turbo",
    });
    const result = parseInt(completion.choices[0].message.content || "8");
    return isNaN(result) ? 8 : result;
  } catch (e) {
    return 8;
  }
}

export async function suggestDeadlineAction(title: string, priority: string) {
  if (isSimulated) {
    await simulateDelay();
    const date = new Date();
    if (priority === "URGENT") date.setDate(date.getDate() + 1);
    else if (priority === "HIGH") date.setDate(date.getDate() + 3);
    else if (priority === "MEDIUM") date.setDate(date.getDate() + 7);
    else date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a project manager. Suggest a deadline in YYYY-MM-DD format based on the task urgency. Today is " + new Date().toISOString() + ". Return ONLY the date string." },
        { role: "user", content: `Task: ${title}\nPriority: ${priority}` }
      ],
      model: "gpt-3.5-turbo",
    });
    return completion.choices[0].message.content?.trim() || "";
  } catch (e) {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  }
}

export async function suggestAssigneeAction(title: string, description: string, users: { id: string; name: string | null }[]) {
  if (isSimulated) {
    await simulateDelay();
    if (!users || users.length === 0) return null;
    // Pick randomly or based on name
    return users[Math.floor(Math.random() * users.length)].id;
  }

  try {
    const usersList = users.map(u => `${u.name} (ID: ${u.id})`).join(", ");
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a resource manager. Suggest the best assignee ID for the task based on the names. Return ONLY the ID of the user." },
        { role: "user", content: `Task: ${title}\nDesc: ${description}\nUsers: ${usersList}` }
      ],
      model: "gpt-3.5-turbo",
    });
    const resultId = completion.choices[0].message.content?.trim();
    if (users.find(u => u.id === resultId)) return resultId;
    return users[0]?.id;
  } catch (e) {
    return users[0]?.id;
  }
}

export async function riskAnalysisAction(title: string, description: string, priority: string) {
  if (isSimulated) {
    await simulateDelay();
    return `### Risk Analysis
- **Execution Risk**: ${priority === "URGENT" ? "High - Short timeframe." : "Medium"}
- **Dependencies**: Potential blockers from external stakeholders.
- **Mitigation**: Ensure daily syncs and clear communication channels.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a risk analyst. Provide a brief markdown summary of risks for this task." },
        { role: "user", content: `Task: ${title}\nPriority: ${priority}\nDesc: ${description}` }
      ],
      model: "gpt-4-turbo-preview",
    });
    return completion.choices[0].message.content || "";
  } catch (e) {
    return "Failed to analyze risks.";
  }
}
