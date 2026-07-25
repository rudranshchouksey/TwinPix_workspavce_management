"use client";

import React, { useState } from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteProjectAction, updateProjectStatusAction } from "@/actions/projects";

export function ProjectSettingsTab({ project }: { project: any }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(project.status);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone and will delete or unlink all campaigns and tasks.")) return;
    
    setDeleting(true);
    const result = await deleteProjectAction(project.id);
    if (result.success) {
      toast.success("Project deleted successfully");
      router.push("/projects");
    } else {
      toast.error(result.error || "Failed to delete project");
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (status === project.status) return;
    setUpdating(true);
    const result = await updateProjectStatusAction(project.id, status);
    if (result.success) {
      toast.success("Project status updated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update status");
    }
    setUpdating(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PremiumCard className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Project Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Project Status</label>
            <div className="flex gap-4">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
              <Button 
                onClick={handleStatusUpdate} 
                disabled={updating || status === project.status}
                className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]"
              >
                {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="p-6 border-red-500/20 bg-red-50/50">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600/70 mb-4">
          Deleting a project is irreversible. It will remove the project and may unlink or delete associated campaigns and tasks.
        </p>
        <Button 
          onClick={handleDelete}
          disabled={deleting}
          variant="destructive"
          className="bg-red-500 text-white hover:bg-red-600 border-none"
        >
          {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
          Delete Project
        </Button>
      </PremiumCard>
    </div>
  );
}
