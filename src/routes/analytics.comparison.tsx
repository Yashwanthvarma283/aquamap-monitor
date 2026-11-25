import { createFileRoute } from "@tanstack/react-router";
import { ComparisonView } from "@/components/dashboard/AnalyticsViews";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/analytics/comparison")({
  head: () =>
    pageHead(
      "Water Body Comparison",
      "Compare water body averages and inspect weighted parameter contributions to the Water Quality Index.",
    ),
  component: ComparisonView,
});
