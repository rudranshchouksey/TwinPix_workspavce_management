"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { createProjectAction, updateProjectStatusAction, deleteProjectAction } from "@/actions/projects";
import { toast } from "sonner";
import { FolderKanban, Plus, Trash2, Edit2, Loader2, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PremiumCard } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";

interface ProjectsViewProps {
  initialProjects: any[];
  clients: any[];
}

export function ProjectsView({ initialProjects, clients }: ProjectsViewProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const result = await createProjectAction({ name, description, clientId });
    if (result.success) {
      toast.success("Project created successfully!");
      setIsOpen(false);
      setName("");
      setDescription("");
      setClientId("");
      // Optimistic update - in reality you might fetch or pass back the new project fully populated
      setProjects([
        {
          ...result.project,
          client: clients.find(c => c.id === result.project?.clientId) || null,
          campaigns: []
        },
        ...projects
      ]);
    } else {
      toast.error(result.error);
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status } : p));
    const result = await updateProjectStatusAction(id, status);
    if (!result.success) toast.error("Failed to update status");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    setProjects(projects.filter(p => p.id !== id));
    const result = await deleteProjectAction(id);
    if (!result.success) toast.error("Failed to delete project");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] text-white hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-500)] shadow-md transition-all duration-200" />
          }>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[var(--color-surface-950)] border-[var(--color-border)] text-[var(--color-text-primary)] shadow-executive-lg">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Client (Optional)</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                >
                  <option value="">No Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] resize-none"
                  rows={3}
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="flex items-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Project
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] py-16 text-center">
          <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
            <FolderKanban className="h-8 w-8 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No projects found</h3>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            Get started by creating a new project to group your campaigns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <PremiumCard key={project.id} hoverEffect="lift" className="p-5 group relative flex flex-col h-full border-[rgba(0,0,0,0.08)]">
              
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <button className="p-1.5 rounded-md hover:bg-[rgba(0,0,0,0.05)] text-[var(--color-text-muted)] transition-colors opacity-0 group-hover:opacity-100" />
                  }>
                    <MoreVertical className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-[var(--color-surface-900)] border-[rgba(0,0,0,0.1)]">
                    <DropdownMenuItem onClick={() => handleStatusChange(project.id, project.status === "ACTIVE" ? "COMPLETED" : "ACTIVE")} className="cursor-pointer text-sm py-2">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Mark {project.status === "ACTIVE" ? "Completed" : "Active"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(project.id)} className="cursor-pointer text-sm py-2 text-red-400 focus:text-red-300 focus:bg-red-400/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] pr-8">{project.name}</h3>
                {project.client && (
                  <p className="text-xs font-medium text-[var(--color-brand-400)] mt-1">{project.client.companyName}</p>
                )}
              </div>
              
              {project.description && (
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">{project.description}</p>
              )}

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-[rgba(0,0,0,0.05)]">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                  project.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {project.status}
                </span>
                
                <span className="text-xs text-[var(--color-text-muted)] font-bold">
                  {project.campaigns?.length || 0} Campaigns
                </span>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}
    </div>
  );
}
