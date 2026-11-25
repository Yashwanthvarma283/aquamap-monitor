import { createFileRoute } from "@tanstack/react-router";
import { StationDirectory } from "@/components/dashboard/StationDirectory";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/stations")({
  head: () =>
    pageHead(
      "Station Directory",
      "Browse, filter and export November sample readings across Chennai rivers, lakes, ponds and groundwater.",
    ),
  component: StationDirectory,
});
