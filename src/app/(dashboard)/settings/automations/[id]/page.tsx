"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWorkflowAction, updateWorkflowStepsAction } from "@/actions/workflows";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { toast } from "sonner";
import { Loader2, ArrowDown, Plus, Save, Trash2, Mail, MessageSquare, Calendar, CheckSquare, Zap, Activity, Clock, Settings } from "lucide-react";
import Link from "next/link";

export default function AutomationBuilderPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const data = await getWorkflowAction(id as string);
      if (!data) {
        toast.error("Workflow not found");
        router.push("/settings/automations");
        return;
      }
      setWorkflow(data);
      setSteps(data.steps || []);
    } catch (err: any) {
      toast.error("Failed to load workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWorkflowStepsAction(id as string, steps);
      toast.success("Workflow saved successfully");
    } catch (err: any) {
      toast.error("Failed to save workflow steps");
    } finally {
      setSaving(false);
    }
  };

  const addStep = (type: string, actionType?: string) => {
    const newStep = {
      id: `temp-${Date.now()}`,
      type,
      actionType,
      config: actionType === "CREATE_TASK" ? { title: "New Task" } : 
              actionType === "SEND_EMAIL" ? { title: "Email Subject", message: "Hello!" } :
              actionType === "DELAY" ? { delayHours: 24 } : {}
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStepConfig = (index: number, key: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      config: {
        ...newSteps[index].config,
        [key]: value
      }
    };
    setSteps(newSteps);
  };

  const getActionIcon = (actionType: string) => {
    switch(actionType) {
      case "SEND_EMAIL": return <Mail className="w-5 h-5 text-blue-500" />;
      case "SEND_WHATSAPP": return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "CREATE_TASK": return <CheckSquare className="w-5 h-5 text-orange-500" />;
      case "GENERATE_CALENDAR_EVENTS": return <Calendar className="w-5 h-5 text-purple-500" />;
      case "GENERATE_AI_SUMMARY": return <Zap className="w-5 h-5 text-yellow-500" />;
      case "NOTIFY_TEAM": return <Activity className="w-5 h-5 text-red-500" />;
      default: return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    return actionType?.replace(/_/g, " ") || "Action";
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-500)]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/settings/automations" className="text-sm text-[var(--color-brand-500)] font-medium hover:underline mb-2 block">
            &larr; Back to Automations
          </Link>
          <PageHeader 
            title={workflow.name} 
            description="Configure the triggers and actions for this workflow"
          />
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Flow
        </button>
      </div>

      {/* Trigger Block */}
      <div className="flex flex-col items-center">
        <PremiumCard className="w-full max-w-2xl p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Zap className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Trigger</p>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {workflow.triggerType === "CAMPAIGN_STATUS" ? "Campaign Status Changed" : 
                 workflow.triggerType === "TASK_OVERDUE" ? "Task Overdue" : workflow.triggerType}
              </h3>
            </div>
          </div>
          <div className="bg-[rgba(0,0,0,0.02)] p-4 rounded-lg text-sm text-[var(--color-text-secondary)] font-mono border border-[rgba(0,0,0,0.05)]">
            Conditions: {JSON.stringify(workflow.triggerData)}
          </div>
        </PremiumCard>

        {/* Steps List */}
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="h-8 w-px bg-gradient-to-b from-orange-200 to-gray-300 my-1"></div>
            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-full p-1 shadow-sm relative z-10">
              <ArrowDown className="w-4 h-4 text-gray-400" />
            </div>
            <div className="h-8 w-px bg-gray-300 my-1"></div>

            <PremiumCard className="w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {step.type === "ACTION" ? getActionIcon(step.actionType) : <Clock className="w-6 h-6 text-indigo-500" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Step {index + 1}: {step.type}
                    </p>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] capitalize">
                      {step.type === "ACTION" ? getActionLabel(step.actionType) : "Delay Execution"}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => removeStep(index)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Step Config Form */}
              <div className="space-y-4 pt-4 border-t border-[rgba(0,0,0,0.08)]">
                {step.type === "DELAY" && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Delay (Hours)</label>
                    <input 
                      type="number" 
                      value={step.config?.delayHours || 24}
                      onChange={(e) => updateStepConfig(index, "delayHours", parseInt(e.target.value))}
                      className="w-full bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                )}
                
                {["SEND_EMAIL", "SEND_WHATSAPP", "NOTIFY_TEAM"].includes(step.actionType) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
                      <input 
                        type="text" 
                        value={step.config?.title || ""}
                        onChange={(e) => updateStepConfig(index, "title", e.target.value)}
                        className="w-full bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm"
                        placeholder="Notification Title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Message</label>
                      <textarea 
                        value={step.config?.message || ""}
                        onChange={(e) => updateStepConfig(index, "message", e.target.value)}
                        className="w-full bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm h-20"
                        placeholder="Notification Content"
                      />
                    </div>
                  </>
                )}

                {step.actionType === "CREATE_TASK" && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Task Title</label>
                    <input 
                      type="text" 
                      value={step.config?.title || ""}
                      onChange={(e) => updateStepConfig(index, "title", e.target.value)}
                      className="w-full bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm"
                      placeholder="e.g. Review Campaign Assets"
                    />
                  </div>
                )}
              </div>
            </PremiumCard>
          </React.Fragment>
        ))}

        {/* Add Step Button */}
        <div className="h-12 w-px bg-dashed border-l-2 border-gray-300 border-dashed my-2"></div>
        <div className="relative group w-full max-w-2xl">
          <div className="absolute inset-0 bg-white opacity-80 z-0"></div>
          <div className="relative z-10 flex flex-wrap gap-2 justify-center p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="w-full text-center text-sm font-medium text-gray-500 mb-2">Add next step</p>
            <button onClick={() => addStep("ACTION", "CREATE_TASK")} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors">
              <CheckSquare className="w-4 h-4" /> Create Task
            </button>
            <button onClick={() => addStep("ACTION", "NOTIFY_TEAM")} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors">
              <Activity className="w-4 h-4" /> Notify Team
            </button>
            <button onClick={() => addStep("ACTION", "SEND_EMAIL")} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
              <Mail className="w-4 h-4" /> Email
            </button>
            <button onClick={() => addStep("ACTION", "SEND_WHATSAPP")} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </button>
            <button onClick={() => addStep("ACTION", "GENERATE_CALENDAR_EVENTS")} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors">
              <Calendar className="w-4 h-4" /> Event
            </button>
            <button onClick={() => addStep("ACTION", "GENERATE_AI_SUMMARY")} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 transition-colors">
              <Zap className="w-4 h-4" /> AI Summary
            </button>
            <button onClick={() => addStep("DELAY")} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
              <Clock className="w-4 h-4" /> Delay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
