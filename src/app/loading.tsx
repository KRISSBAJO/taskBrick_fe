import { AppLoadingSurface } from "@/components/ui/loading-surface";

export default function RootLoading() {
  return (
    <AppLoadingSurface
      title="Loading TaskBricks..."
      subtitle="Preparing the next screen."
      steps={["Route", "Assets", "Data"]}
    />
  );
}
