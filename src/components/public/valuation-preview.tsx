import { valuationCopy } from "@/lib/valuation-request";

const scenarioFill: Record<(typeof valuationCopy.scenarios)[number]["id"], string> = {
  low: "42%",
  base: "68%",
  high: "92%",
};

const scenarioTone: Record<(typeof valuationCopy.scenarios)[number]["id"], string> = {
  low: "bg-[#d7ebe8] text-[#0b5559]",
  base: "bg-[#0f6e73] text-white",
  high: "bg-[#c45c2b] text-white",
};

export function ValuationPreview() {
  const copy = valuationCopy;
  return (
    <aside className="releva-valorar-send" aria-label={copy.asideTitle}>
      <div className="releva-valorar-send-head">
        <p className="releva-valorar-mark">Relify</p>
        <span className="releva-valorar-stamp">{copy.freeStamp}</span>
      </div>
      <h2>{copy.asideTitle}</h2>
      <p className="releva-valorar-send-free">{copy.freeLine}</p>

      <p className="releva-valorar-formula-kicker">{copy.formulaTitle}</p>
      <ol className="releva-valorar-formula" aria-label={copy.formulaTitle}>
        <li>
          <span>{copy.formulaEv}</span>
        </li>
        <li>
          <span>{copy.formulaEquity}</span>
        </li>
      </ol>
      <p className="releva-valorar-send-hint">{copy.formulaHint}</p>

      <div className="releva-valorar-example">
        <span className="releva-valorar-example-chip">{copy.exampleLabel}</span>
        <p>
          {copy.exampleEbitda}
          <span aria-hidden> · </span>
          {copy.exampleDebt}
        </p>
        <ul className="releva-valorar-scenarios">
          {copy.scenarios.map((row) => (
            <li key={row.id}>
              <div className="releva-valorar-scenario-meta">
                <span>{row.title}</span>
                <b>{row.multiple}</b>
              </div>
              <span className="releva-valorar-scenario-track" aria-hidden>
                <i className={scenarioTone[row.id]} style={{ width: scenarioFill[row.id] }} />
              </span>
              <p>
                EV {row.ev}
                <span aria-hidden> → </span>
                equity {row.equity}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="releva-valorar-mini" aria-hidden>
        <p className="releva-valorar-mini-kicker">{copy.previewKicker}</p>
        <p className="releva-valorar-mini-title">{copy.previewTitle}</p>
        <span className="releva-valorar-mini-bars">
          <i />
          <i />
          <i />
        </span>
        <span className="releva-valorar-example-chip">{copy.exampleLabel}</span>
      </div>

      <ol className="releva-valorar-steps">
        {copy.steps.map((step) => (
          <li key={step.n}>
            <span>{step.n}</span>
            <span>
              <strong>{step.title}</strong>
              {step.body}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
