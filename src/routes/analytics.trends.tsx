import { createFileRoute } from "@tanstack/react-router";
import { TrendsView } from "@/components/dashboard/AnalyticsViews";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/analytics/trends")({
  head: () =>
    pageHead(
      "Monthly Trends",
      "Inspect six-month station and parameter trends across the Chennai sample network.",
    ),
  component: TrendsView,
});
