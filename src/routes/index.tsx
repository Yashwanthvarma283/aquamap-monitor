import { createFileRoute } from "@tanstack/react-router";
import { MapWorkspace } from "@/components/dashboard/MapWorkspace";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Water Explorer",
      "Explore 16 illustrative Chennai water-quality stations on an interactive street and satellite map.",
    ),
  component: MapWorkspace,
});
