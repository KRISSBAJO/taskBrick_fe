import { SkeletonBlock } from "@/components/ui/foundation";

export default function WorkspaceLoading() {
  return (
    <div className="grid gap-4">
      <SkeletonBlock className="h-28" />
      <div className="grid gap-4 lg:grid-cols-4">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <SkeletonBlock className="h-[420px]" />
    </div>
  );
}
