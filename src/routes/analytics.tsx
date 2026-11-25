import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ChartNoAxesCombined, TrendingUp, GitCompareArrows, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/analytics")({
  head: () =>
    pageHead(
      "Water Analytics",
      "Dedicated water quality overview, monthly trends, comparisons and parameter breach analytics for Chennai.",
    ),
  component: AnalyticsLayout,
});
const tabs = [
  { to: "/analytics", label: "Overview", icon: ChartNoAxesCombined },
  { to: "/analytics/trends", label: "Trends", icon: TrendingUp },
  { to: "/analytics/comparison", label: "Comparison", icon: GitCompareArrows },
  { to: "/analytics/breaches", label: "Limit breaches", icon: ShieldAlert },
] as const;
function AnalyticsLayout() {
  return (
    <main className="content-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">RESEARCH & INSIGHTS</div>
          <h1>
            Water quality analytics<span className="title-dot">.</span>
          </h1>
          <p>From individual samples to network-wide patterns.</p>
        </div>
        <div className="study-period">
          <span className="status-dot" />
          June — November<small>Illustrative sample dataset</small>
        </div>
      </div>
      <nav className="analytics-tabs" aria-label="Analytics tabs">
        {tabs.map((t) => (
          <Button asChild variant="ghost" key={t.to}>
            <Link to={t.to} activeOptions={{ exact: true }} activeProps={{ className: "active" }}>
              <t.icon />
              {t.label}
            </Link>
          </Button>
        ))}
      </nav>
      <Outlet />
      <p className="dataset-footnote">
        Derived from illustrative sample readings. Study reference limits combine parameter-specific
        sources; this is not a drinking-water certification.
      </p>
    </main>
  );
}
