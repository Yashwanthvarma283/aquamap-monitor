import { Link, useRouterState } from "@tanstack/react-router";
import {
  Droplets,
  Map,
  Layers3,
  ChartNoAxesCombined,
  FlaskConical,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
const links = [
  { to: "/", label: "Explorer", icon: Map },
  { to: "/stations", label: "Stations", icon: Layers3 },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/calculator", label: "Sample lab", icon: FlaskConical },
] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const section = links.find((l) => (l.to === "/" ? pathname === "/" : pathname.startsWith(l.to)));
  return (
    <div className="app-shell">
      <aside className="side-rail">
        <Link to="/" className="brand">
          <span className="brand-symbol">
            <Droplets />
          </span>
          <span>
            AquaMap<span className="brand-subtitle">WATER INTELLIGENCE</span>
          </span>
        </Link>
        <div className="rail-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {links.map((l) => (
            <Button
              asChild
              variant="ghost"
              key={l.to}
              className={`rail-link ${section?.to === l.to ? "active" : ""}`}
            >
              <Link to={l.to}>
                <l.icon />
                <span>{l.label}</span>
                {section?.to === l.to && <span className="nav-active-dot" />}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="rail-bottom">
          <div className="study-badge">
            <span className="status-dot" />
            CHENNAI STUDY AREA
          </div>
          <p>Biology capstone</p>
          <span>Illustrative dataset · Jun–Nov</span>
          <div className="rail-profile">
            <span className="profile-initial">V</span>
            <div>
              VARMA_283<small>Research workspace</small>
            </div>
            <ArrowUpRight className="size-4" />
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="workspace-header">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{section?.label ?? "AquaMap"}</strong>
          </div>
          <div className="header-location">
            <MapPin className="size-3.5" />
            Chennai, Tamil Nadu
            <span className="header-divider" />
            <span className="sample-pill">SAMPLE DATA</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
