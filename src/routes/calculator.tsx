import { createFileRoute } from "@tanstack/react-router";
import { SampleCalculator } from "@/components/SampleCalculator";
import { PARAMS } from "@/lib/water";
import { pageHead } from "@/lib/analytics";
export const Route = createFileRoute("/calculator")({
  head: () =>
    pageHead(
      "Sample Lab",
      "Calculate the weighted arithmetic WQI for a water sample with transparent parameter standards and methodology.",
    ),
  component: SampleLab,
});
function SampleLab() {
  return (
    <main className="content-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">WEIGHTED ARITHMETIC METHOD</div>
          <h1>
            Sample lab<span className="title-dot">.</span>
          </h1>
          <p>Six measurements. One water quality index.</p>
        </div>
      </div>
      <div className="lab-grid">
        <SampleCalculator />
        <section className="lab-reference">
          <h2>Study reference limits</h2>
          {PARAMS.map((p) => (
            <div key={p.key}>
              <span>{p.label}</span>
              <strong>
                {p.key === "ph"
                  ? "6.5–8.5"
                  : `${p.higherIsBetter ? "≥" : "≤"} ${p.standard} ${p.unit}`}
              </strong>
            </div>
          ))}
          <p>
            Parameter-specific references: BIS IS 10500 / WHO / CPCB. The composite index is for
            this capstone study, not a safety certification.
          </p>
        </section>
      </div>
      <section className="methodology lab-method">
        <h2>Methodology & classification</h2>
        <div className="method-grid">
          <div>
            <span>01 / SUB-INDEX</span>
            <h3>Measurement to score</h3>
            <p>
              Qᵢ = 100 × |(Vᵢ − V₀) / (Sᵢ − V₀)|. Ideal values: pH 7, DO 14.6 mg/L, and 0 for the
              other parameters.
            </p>
          </div>
          <div>
            <span>02 / WEIGHTING</span>
            <h3>Weighted arithmetic index</h3>
            <p>
              Wᵢ = 1 / Sᵢ. WQI = Σ(WᵢQᵢ) / ΣWᵢ. Stricter parameter limits have greater influence.
            </p>
          </div>
          <div>
            <span>03 / CLASSIFICATION</span>
            <h3>Five quality bands</h3>
            <p>
              ≤25 Excellent · &gt;25–50 Good · &gt;50–75 Poor · &gt;75–100 Very Poor · &gt;100
              Unsuitable.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
