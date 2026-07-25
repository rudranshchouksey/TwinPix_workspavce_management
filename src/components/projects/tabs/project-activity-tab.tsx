import React from "react";
import { UnifiedActivityTimeline } from "./unified-activity-timeline";

export function ProjectActivityTab({ project }: { project: any }) {
  return (
    <div className="w-full">
      <UnifiedActivityTimeline projectId={project.id} />
    </div>
  );
}
