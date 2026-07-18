"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { updateProfileSettingsAction } from "@/actions/users";
import { uploadUserImageAction } from "@/actions/upload-user-image";
import { compressImage } from "@/lib/image-compression";

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

type EditProfileInput = z.infer<typeof editProfileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string | null;
    image: string | null;
    jobTitle: string | null;
    department: string | null;
  };
  onSuccess?: () => void;
}

export function EditProfileDialog({ open, onOpenChange, user, onSuccess }: EditProfileDialogProps) {
  const { update } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user.name || "",
      jobTitle: user.jobTitle || "",
      department: user.department || "",
    },
  });

  useEffect(() => {
    if (open) {
      setImageFile(null);
      setImagePreview(user.image || null);
      form.reset({
        name: user.name || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
      });
    }
  }, [open, user, form]);

  const onSubmit = async (data: EditProfileInput) => {
    setIsPending(true);
    try {
      let imageUrl = user.image;

      if (imageFile) {
        const compressedFile = await compressImage(imageFile, 800);
        const formData = new FormData();
        formData.append("file", compressedFile);
        const result = await uploadUserImageAction(formData);
        imageUrl = result.url;
      }

      await updateProfileSettingsAction({
        name: data.name,
        jobTitle: data.jobTitle,
        department: data.department,
        image: imageUrl || undefined,
      });

      toast.success("Profile updated successfully");
      
      // Update Next-Auth session if name or image changed
      await update({ name: data.name, image: imageUrl });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error: Error | any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)]">Edit Profile</DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted)]">
            Update your public-facing information and avatar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="flex flex-col items-center justify-center mb-6 pt-4">
              <div className="relative group cursor-pointer">
                <Avatar className="h-24 w-24 border-2 border-[var(--color-brand-500)] shadow-lg transition-transform hover:scale-105">
                  <AvatarImage src={imagePreview || ""} alt="Profile" className="object-cover" />
                  <AvatarFallback className="bg-[rgba(0,0,0,0.05)] text-2xl font-semibold text-[var(--color-text-primary)]">
                    {form.watch("name")?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div 
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => document.getElementById("profile-avatar-upload")?.click()}
                >
                  <Camera className="w-7 h-7 text-white" />
                </div>
                
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3 font-medium uppercase tracking-wider">
                Click avatar to change
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your Name"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Senior Designer"
                          className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Creative"
                          className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] shadow-md hover:shadow-lg transition-all"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
