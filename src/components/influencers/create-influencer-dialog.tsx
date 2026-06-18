"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createInfluencerAction } from "@/actions/influencers";
import { useRouter } from "next/navigation";

export function CreateInfluencerDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Basic Fields
  const [instagramHandle, setInstagramHandle] = useState("");
  const [influencerName, setInfluencerName] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [category, setCategory] = useState("");
  const [followers, setFollowers] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instagramHandle.trim()) {
      toast.error("Handle is required");
      return;
    }

    setSubmitting(true);
    try {
      await createInfluencerAction({
        instagramHandle: instagramHandle.replace("@", "").trim(),
        influencerName: influencerName.trim(),
        platform,
        category,
        followers: followers ? parseInt(followers, 10) : undefined,
        email: email.trim(),
        profileImage: profileImage.trim() || undefined,
        status: "NEW_LEAD",
        campaignCount: 0
      });
      toast.success("Influencer created successfully!");
      setIsOpen(false);
      
      // Reset form
      setInstagramHandle("");
      setInfluencerName("");
      setPlatform("Instagram");
      setCategory("");
      setFollowers("");
      setEmail("");
      setProfileImage("");
      
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create influencer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<button className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-[var(--color-brand-600)] active:scale-[0.98]" />}>
        <Plus className="w-4 h-4" />
        Add Influencer
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-white border-[var(--color-border)] text-[var(--color-text-primary)] shadow-executive-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Influencer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">Profile Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={profileImage}
                  onChange={e => setProfileImage(e.target.value)}
                  className="w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] shadow-sm"
                />
                <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {profileImage ? (
                    <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[var(--color-text-muted)]" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">Platform</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] shadow-sm font-medium"
              >
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Twitter">Twitter</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">Handle / Username *</label>
              <input
                type="text"
                placeholder="@username"
                value={instagramHandle}
                onChange={e => setInstagramHandle(e.target.value)}
                required
                className="w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] shadow-sm font-medium"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={influencerName}
                onChange={e => setInfluencerName(e.target.value)}
                className="w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] shadow-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">Category</label>
              <input
                type="text"
                placeholder="e.g. Fashion, Tech"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] shadow-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">Followers</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={followers}
                onChange={e => setFollowers(e.target.value)}
                className="w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] shadow-sm font-medium"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">Email (Optional)</label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] shadow-sm font-medium"
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !instagramHandle.trim()}
              className="flex items-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Influencer
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
