import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsOverview } from "@/components/dashboard/AnalyticsViews";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/analytics/")({
  head: () =>
    pageHead(
      "Analytics Overview",
      "Quality distribution, network trajectory, improving stations and priority watchlist for Chennai sample stations.",
    ),
  component: AnalyticsOverview,
});
