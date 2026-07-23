import { db } from "../lib/db";

async function main() {
  console.log("Seeding Automations...");

  // Clear existing workflows (for development idempotency)
  await db.workflowExecution.deleteMany();
  await db.workflowStep.deleteMany();
  await db.workflow.deleteMany();

  // 1. Campaign Created -> Automatically create default tasks
  const wf1 = await db.workflow.create({
    data: {
      name: "Default Onboarding Tasks",
      triggerType: "CAMPAIGN_CREATED",
      steps: {
        create: [
          { type: "ACTION", actionType: "CREATE_TASK", order: 1, config: { title: "Define Audience Persona", description: "Initial setup." } },
          { type: "ACTION", actionType: "CREATE_TASK", order: 2, config: { title: "Draft Creative Brief", description: "Initial setup." } }
        ]
      }
    }
  });

  // 2. Task Completed -> Notify Manager -> Create Next Task
  const wf2 = await db.workflow.create({
    data: {
      name: "Task Completed Escalation",
      triggerType: "TASK_COMPLETED",
      steps: {
        create: [
          { type: "ACTION", actionType: "NOTIFY_MANAGER", order: 1, config: { title: "Task Needs Review", message: "A task has been completed and requires your review." } },
          { type: "ACTION", actionType: "CREATE_TASK", order: 2, config: { title: "Review Completed Task Deliverables", description: "Manager review required." } }
        ]
      }
    }
  });

  // 3. Due Tomorrow -> Reminder
  const wf3 = await db.workflow.create({
    data: {
      name: "Due Tomorrow Reminder",
      triggerType: "TASK_DUE_TOMORROW",
      steps: {
        create: [
          { type: "ACTION", actionType: "DASHBOARD_ALERT", order: 1, config: { title: "Task Due Tomorrow!", message: "Please ensure you are on track." } }
        ]
      }
    }
  });

  // 4. Overdue -> Email -> WhatsApp -> Dashboard Alert
  const wf4 = await db.workflow.create({
    data: {
      name: "Overdue Escalation",
      triggerType: "TASK_OVERDUE",
      steps: {
        create: [
          { type: "ACTION", actionType: "SEND_EMAIL", order: 1, config: { title: "URGENT: Task Overdue", message: "Your task is overdue. Please address it immediately." } },
          { type: "ACTION", actionType: "SEND_WHATSAPP", order: 2, config: { title: "URGENT", message: "Overdue Task Alert." } },
          { type: "ACTION", actionType: "DASHBOARD_ALERT", order: 3, config: { title: "CRITICAL: Task Overdue", message: "This task has missed its deadline!" } }
        ]
      }
    }
  });

  // 5. Campaign Completed -> Close Remaining Tasks
  const wf5 = await db.workflow.create({
    data: {
      name: "Campaign Cleanup",
      triggerType: "CAMPAIGN_COMPLETED",
      steps: {
        create: [
          { type: "ACTION", actionType: "CLOSE_REMAINING_TASKS", order: 1, config: {} }
        ]
      }
    }
  });

  console.log("Seeding complete. 5 Automation Workflows created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
