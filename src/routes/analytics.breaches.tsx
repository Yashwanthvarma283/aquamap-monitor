import { createFileRoute } from "@tanstack/react-router";
import { BreachesView } from "@/components/dashboard/AnalyticsViews";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/analytics/breaches")({
  head: () =>
    pageHead(
      "Parameter Breaches",
      "Filter and export sample water-quality measurements outside study reference limits.",
    ),
  component: BreachesView,
});
