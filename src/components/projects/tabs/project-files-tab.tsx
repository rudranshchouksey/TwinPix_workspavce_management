"use client";

import React, { useState, useRef, useTransition } from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { File, Download, ExternalLink, Folder, Image as ImageIcon, Video, FileText, UploadCloud, Search, Tag, Clock, MessageSquare, X, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { uploadFileAction, addFileCommentAction, updateFileAction } from "@/actions/files";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FOLDERS = [
  "All Files",
  "Contracts",
  "Brand Assets",
  "Invoices",
  "Content",
  "Photos",
  "Videos",
  "Design Files",
  "Documents",
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

export function ProjectFilesTab({ project }: { project: any }) {
  const router = useRouter();
  const [activeFolder, setActiveFolder] = useState("All Files");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flatten files (projects + campaigns + tasks)
  const fileMap = new Map();
  
  (project.files || []).forEach((f: any) => {
    fileMap.set(f.id, { ...f, source: { type: 'Project', name: project.name, id: project.id } });
  });

  (project.campaigns || []).forEach((c: any) => {
    (c.files || []).forEach((f: any) => {
      fileMap.set(f.id, { ...f, source: { type: 'Campaign', name: c.name, id: c.id } });
    });
  });
  
  (project.tasks || []).forEach((t: any) => {
    (t.files || []).forEach((f: any) => {
      fileMap.set(f.id, { ...f, source: { type: 'Task', name: t.title, id: t.id } });
    });
  });

  const allFiles = Array.from(fileMap.values());
  const sortedFiles = allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter
  const filteredFiles = sortedFiles.filter(file => {
    const matchesFolder = activeFolder === "All Files" || file.folder === activeFolder;
    const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (file.tags && file.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFolder && matchesSearch;
  });

  // Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = (file: File) => {
    const folderToUpload = activeFolder === "All Files" ? "Content" : activeFolder;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", project.id);
    formData.append("folder", folderToUpload);

    startTransition(async () => {
      toast.loading("Uploading file...", { id: "upload" });
      const res = await uploadFileAction(formData);
      if (res.success) {
        toast.success("File uploaded successfully", { id: "upload" });
        router.refresh();
      } else {
        toast.error(res.error || "Upload failed", { id: "upload" });
      }
    });
  };

  const [commentText, setCommentText] = useState("");
  const handleAddComment = () => {
    if (!commentText.trim() || !selectedFile) return;
    
    startTransition(async () => {
      const res = await addFileCommentAction(selectedFile.id, commentText);
      if (res.success) {
        toast.success("Comment added");
        setCommentText("");
        router.refresh(); // In reality, we'd update local state too
      } else {
        toast.error("Failed to add comment");
      }
    });
  };

  return (
    <div className="flex h-[800px] gap-6">
      
      {/* SIDEBAR */}
      <div className="w-64 flex flex-col gap-2 flex-shrink-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Folders</h3>
        {FOLDERS.map(folder => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFolder === folder 
                ? "bg-[var(--color-brand-50)] text-[var(--color-brand-600)]" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Folder className={`w-4 h-4 ${activeFolder === folder ? "fill-[var(--color-brand-100)]" : ""}`} />
            {folder}
            {folder !== "All Files" && (
              <span className="ml-auto text-xs bg-white rounded-full px-2 border border-gray-100 shadow-sm">
                {allFiles.filter(f => f.folder === folder).length}
              </span>
            )}
          </button>
        ))}

        <div className="mt-8 px-2">
          <PremiumCard 
            className={`border-2 border-dashed transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
              isDragging ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]" : "border-gray-200 hover:border-gray-300 bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? "text-[var(--color-brand-500)]" : "text-gray-400"}`} />
            <p className="text-sm font-medium text-gray-700">Drag & Drop or Click</p>
            <p className="text-xs text-gray-500 mt-1">Upload to {activeFolder === "All Files" ? "Content" : activeFolder}</p>
          </PremiumCard>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{activeFolder}</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search files or tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-auto p-4">
          {filteredFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <File className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No files found</h3>
              <p className="text-gray-500 text-sm mt-1">Drop files here to upload</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map(file => (
                <div 
                  key={file.id} 
                  onClick={() => setSelectedFile(file)}
                  className={`group relative p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFile?.id === file.id 
                      ? "border-[var(--color-brand-500)] ring-1 ring-[var(--color-brand-500)] bg-[var(--color-brand-50)]/30" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="aspect-video w-full rounded-lg bg-gray-100 mb-3 flex items-center justify-center overflow-hidden relative">
                    {file.mimeType.startsWith('image/') ? (
                      <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
                    ) : (
                      getFileIcon(file.mimeType)
                    )}
                    {/* Version Badge */}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700 shadow-sm">
                      v{file.version || 1}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 truncate" title={file.originalName}>{file.originalName}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <p className="text-xs text-gray-400">{format(new Date(file.createdAt), "MMM d")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DETAILS PANEL */}
      {selectedFile && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 truncate pr-2">File Details</h3>
            <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {/* Preview Area */}
            <div className="aspect-video bg-gray-100 flex items-center justify-center w-full relative">
               {selectedFile.mimeType.startsWith('image/') ? (
                  <img src={selectedFile.url} alt={selectedFile.originalName} className="w-full h-full object-contain" />
                ) : selectedFile.mimeType.startsWith('video/') ? (
                  <video src={selectedFile.url} controls className="w-full h-full object-contain" />
                ) : (
                  getFileIcon(selectedFile.mimeType)
                )}
            </div>

            <div className="p-4 space-y-6">
              
              {/* Meta */}
              <div>
                <h4 className="font-semibold text-gray-900 text-sm break-all">{selectedFile.originalName}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><Folder className="w-3.5 h-3.5"/> {selectedFile.folder || "Uncategorized"}</div>
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {format(new Date(selectedFile.createdAt), "MMM d, yyyy")}</div>
                  <div className="flex items-center gap-1"><File className="w-3.5 h-3.5"/> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="default" className="flex-1 h-8 text-xs p-0">
                  <Link href={selectedFile.url} target="_blank" className="w-full h-full flex items-center justify-center"><ExternalLink className="w-3.5 h-3.5 mr-1"/> Open</Link>
                </Button>
                <Button variant="outline" className="flex-1 h-8 text-xs p-0">
                  <Link href={selectedFile.url} download className="w-full h-full flex items-center justify-center"><Download className="w-3.5 h-3.5 mr-1"/> Download</Link>
                </Button>
              </div>

              {/* Tags */}
              <div>
                <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedFile.tags || []).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                      {t}
                    </span>
                  ))}
                  <button className="px-2 py-0.5 border border-dashed border-gray-300 text-gray-400 text-xs rounded-md hover:bg-gray-50 hover:text-gray-600 transition-colors">
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Activity / Comments */}
              <div>
                <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Comments & Activity
                </h5>
                
                <div className="space-y-4 mb-4">
                  {/* Fake a few activities for demo since backend fetches might not include them deeply yet, but we will show real ones if available */}
                  {(selectedFile.activities || []).map((act: any) => (
                    <div key={act.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-900"><span className="font-medium">{act.user?.name || "Someone"}</span> {act.details}</p>
                        <p className="text-[10px] text-gray-400">{format(new Date(act.createdAt), "MMM d, h:mm a")}</p>
                      </div>
                    </div>
                  ))}
                  {(selectedFile.comments || []).map((comment: any) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-0.5">
                        {comment.user?.image && <img src={comment.user.image} className="w-full h-full object-cover" />}
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-semibold text-gray-900">{comment.user?.name}</span>
                          <span className="text-[10px] text-gray-400">{format(new Date(comment.createdAt), "h:mm a")}</span>
                        </div>
                        <p className="text-xs text-gray-600">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a comment..." 
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={e => e.key === "Enter" && handleAddComment()}
                  />
                  <Button size="sm" className="h-8 px-3" onClick={handleAddComment} disabled={isPending}>
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
