"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { Plus, Zap, Activity, MoreVertical, Play, Pause, Trash2, Settings, Loader2 } from "lucide-react";
import { getWorkflowsAction, toggleWorkflowAction, deleteWorkflowAction, createWorkflowAction } from "@/actions/workflows";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await getWorkflowsAction();
      setWorkflows(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const newWorkflow = await createWorkflowAction({
        name: "New Automation",
        description: "A new automated workflow",
        triggerType: "CAMPAIGN_STATUS",
        triggerData: { status: "ACTIVE" }
      });
      router.push(`/settings/automations/${newWorkflow.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create workflow");
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleWorkflowAction(id, !current);
      setWorkflows(w => w.map(wf => wf.id === id ? { ...wf, isActive: !current } : wf));
      toast.success(`Workflow ${!current ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error("Failed to toggle workflow");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await deleteWorkflowAction(id);
      setWorkflows(w => w.filter(wf => wf.id !== id));
      toast.success("Workflow deleted");
    } catch (err: any) {
      toast.error("Failed to delete workflow");
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-500)]" /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Workflow Automations" 
          description="Build powerful automated rules similar to Zapier"
        />
        <button 
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
          Create Zap
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((wf) => (
          <PremiumCard key={wf.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-orange-50 rounded-xl">
                  <Zap className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggle(wf.id, wf.isActive)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${wf.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                  >
                    {wf.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-1">{wf.name}</h3>
              <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-4">{wf.description}</p>
              
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-6">
                <Activity className="w-4 h-4" />
                <span>{wf._count.executions} runs</span>
                <span className="mx-1">•</span>
                <span>{wf.steps.length} steps</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t border-[rgba(0,0,0,0.08)]">
              <Link 
                href={`/settings/automations/${wf.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.06)] text-[var(--color-text-primary)] px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <Settings className="w-4 h-4" /> Edit Flow
              </Link>
              <button 
                onClick={() => handleDelete(wf.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </PremiumCard>
        ))}

        {workflows.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-[rgba(0,0,0,0.08)]">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Automations Yet</h3>
            <p className="text-[var(--color-text-muted)] max-w-sm mx-auto mb-6">
              Create your first Zap to automate tasks, emails, and calendar events instantly.
            </p>
            <button 
              onClick={handleCreate}
              className="bg-[var(--color-brand-500)] text-white px-6 py-2.5 rounded-xl font-medium"
            >
              Build Automation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
