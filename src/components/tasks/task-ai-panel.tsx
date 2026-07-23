import { useState } from "react";
import { Sparkles, Wand2, Clock, Flag, UserPlus, ListTodo, ShieldAlert, CalendarClock, Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import {
  generateTaskDescriptionAction,
  improveDescriptionAction,
  generateChecklistAction,
  suggestPriorityAction,
  estimateTimeAction,
  suggestDeadlineAction,
  suggestAssigneeAction,
  riskAnalysisAction,
} from "@/actions/ai-assistant";

interface TaskAIPanelProps {
  form: any;
  users: any[];
  onClose: () => void;
}

export function TaskAIPanel({ form, users, onClose }: TaskAIPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<{ title: string; content: React.ReactNode; type: string } | null>(null);

  const title = form.watch("title");
  const description = form.watch("description");
  const priority = form.watch("priority");

  const runAction = async (actionId: string, actionFn: () => Promise<any>, handleSuccess: (res: any) => void) => {
    if (!title) {
      toast.error("Please enter a task title first.");
      return;
    }
    setIsGenerating(true);
    setActiveAction(actionId);
    setAiResponse(null);
    try {
      const res = await actionFn();
      handleSuccess(res);
    } catch (e: any) {
      toast.error("AI Action failed: " + e.message);
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleGenerateDescription = () => runAction("desc", () => generateTaskDescriptionAction(title), (res) => {
    setAiResponse({
      type: "desc",
      title: "Generated Description",
      content: <div className="text-sm whitespace-pre-wrap">{res}</div>
    });
  });

  const handleImproveDescription = () => {
    if (!description) return toast.error("Description is empty.");
    runAction("improve", () => improveDescriptionAction(description), (res) => {
      setAiResponse({
        type: "desc",
        title: "Improved Description",
        content: <div className="text-sm whitespace-pre-wrap">{res}</div>
      });
    });
  };

  const handleGenerateSubtasks = () => runAction("subtasks", () => generateChecklistAction(title, description), (res: string[]) => {
    setAiResponse({
      type: "subtasks",
      title: "Suggested Subtasks",
      content: (
        <ul className="text-sm space-y-1 list-disc list-inside text-[var(--color-text-secondary)]">
          {res.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )
    });
  });

  const handleRiskAnalysis = () => runAction("risk", () => riskAnalysisAction(title, description, priority), (res) => {
    setAiResponse({
      type: "risk",
      title: "Risk Analysis",
      content: <div className="text-sm whitespace-pre-wrap">{res}</div>
    });
  });

  // Direct Apply Actions
  const handleEstimateTime = () => runAction("time", () => estimateTimeAction(title, description), (res) => {
    form.setValue("estimatedHours", res, { shouldDirty: true });
    toast.success(`Estimated time set to ${res}h`);
  });

  const handleSuggestPriority = () => runAction("priority", () => suggestPriorityAction(title, description), (res) => {
    form.setValue("priority", res, { shouldDirty: true });
    toast.success(`Priority set to ${res}`);
  });

  const handleSuggestDeadline = () => runAction("deadline", () => suggestDeadlineAction(title, priority), (res) => {
    form.setValue("dueDate", res, { shouldDirty: true });
    toast.success(`Deadline set to ${res}`);
  });

  const handleSuggestAssignee = () => runAction("assignee", () => suggestAssigneeAction(title, description, users), (res) => {
    if (res) {
      form.setValue("assigneeId", res, { shouldDirty: true });
      const user = users.find(u => u.id === res);
      toast.success(`Assigned to ${user?.name || 'User'}`);
    } else {
      toast.error("Could not find a suitable assignee.");
    }
  });

  const applyResponseToForm = () => {
    if (!aiResponse) return;
    if (aiResponse.type === "desc") {
      // It's a React element in content, but we want the raw string for the form.
      // We'll store the raw string in a ref or simply just call the API again.
      // For simplicity, let's just extract the string if possible or pass it down via state.
    }
  };

  // We need the raw response for description and subtasks. Let's adjust the state.
  const [rawResponseData, setRawResponseData] = useState<any>(null);

  const runActionWithRaw = async (actionId: string, actionFn: () => Promise<any>, renderFn: (res: any) => React.ReactNode, type: string) => {
    if (!title) {
      toast.error("Please enter a task title first.");
      return;
    }
    setIsGenerating(true);
    setActiveAction(actionId);
    setAiResponse(null);
    try {
      const res = await actionFn();
      setRawResponseData(res);
      setAiResponse({
        type,
        title: actionId.charAt(0).toUpperCase() + actionId.slice(1) + " Results",
        content: renderFn(res)
      });
    } catch (e: any) {
      toast.error("AI Action failed: " + e.message);
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleApply = () => {
    if (!aiResponse || !rawResponseData) return;
    if (aiResponse.type === "description") {
      form.setValue("description", rawResponseData, { shouldDirty: true });
      toast.success("Description updated!");
    } else if (aiResponse.type === "subtasks") {
      const currentChecklist = form.getValues("checklist") || [];
      const newItems = rawResponseData.map((title: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        title,
        completed: false
      }));
      form.setValue("checklist", [...currentChecklist, ...newItems], { shouldDirty: true });
      toast.success("Subtasks added to checklist!");
    }
    setAiResponse(null);
  };

  const ACTIONS = [
    { id: "generateDesc", icon: Wand2, label: "Generate Description", onClick: () => runActionWithRaw("Description", () => generateTaskDescriptionAction(title, description), res => <div className="text-sm whitespace-pre-wrap text-[var(--color-text-secondary)]">{res}</div>, "description") },
    { id: "improveDesc", icon: RefreshCw, label: "Improve Description", onClick: () => {
      if (!description) return toast.error("Description is empty.");
      runActionWithRaw("Description", () => improveDescriptionAction(description), res => <div className="text-sm whitespace-pre-wrap text-[var(--color-text-secondary)]">{res}</div>, "description");
    }},
    { id: "subtasks", icon: ListTodo, label: "Generate Subtasks", onClick: () => runActionWithRaw("Subtasks", () => generateChecklistAction(title, description), (res: string[]) => (
      <ul className="text-sm space-y-2 list-none">
        {res.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[var(--color-text-secondary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-400)] mt-1.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ), "subtasks") },
    { id: "risk", icon: ShieldAlert, label: "Risk Analysis", onClick: () => runActionWithRaw("Risk", () => riskAnalysisAction(title, description, priority), res => <div className="text-sm whitespace-pre-wrap text-[var(--color-text-secondary)]">{res}</div>, "risk") },
  ];

  const QUICK_APPLY_ACTIONS = [
    { id: "time", icon: Clock, label: "Estimate Time", onClick: handleEstimateTime },
    { id: "priority", icon: Flag, label: "Suggest Priority", onClick: handleSuggestPriority },
    { id: "assignee", icon: UserPlus, label: "Suggest Assignee", onClick: handleSuggestAssignee },
    { id: "deadline", icon: CalendarClock, label: "Suggest Deadline", onClick: handleSuggestDeadline },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] border-l border-[rgba(0,0,0,0.08)]">
      <div className="p-4 border-b border-[rgba(0,0,0,0.06)] bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">AI Assistant</h3>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide">TWINPIX INTELLIGENCE</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 rounded-full" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {aiResponse ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl p-4 border border-[rgba(0,0,0,0.06)] shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                {aiResponse.title}
              </h4>
              <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                {aiResponse.content}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-sm h-9 rounded-xl text-xs font-semibold">
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Apply to Task
              </Button>
              <Button variant="outline" onClick={() => setAiResponse(null)} className="flex-1 h-9 rounded-xl text-xs font-semibold border-gray-200">
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Generation</h4>
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="h-auto py-3 px-3 flex flex-col items-start gap-2 bg-white hover:bg-purple-50/50 hover:text-purple-700 hover:border-purple-200 border-gray-200 rounded-xl transition-all text-left justify-start group"
                      onClick={action.onClick}
                      disabled={isGenerating}
                    >
                      {isGenerating && activeAction === action.label.split(' ')[1] ? (
                        <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-purple-100/50 flex items-center justify-center transition-colors">
                          <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-600 transition-colors" />
                        </div>
                      )}
                      <span className="text-[11px] font-semibold leading-tight">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Auto-Fill Fields</h4>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_APPLY_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="h-10 px-3 flex items-center justify-start gap-3 bg-white hover:bg-blue-50/50 hover:text-blue-700 hover:border-blue-200 border-gray-200 rounded-xl transition-all group"
                      onClick={action.onClick}
                      disabled={isGenerating}
                    >
                      {isGenerating && activeAction === action.id ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                      ) : (
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 shrink-0" />
                      )}
                      <span className="text-xs font-semibold">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
