const { useState, useMemo, useCallback, useEffect } = React;
const { AreaChart, Area, BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } = Recharts;

const C = {
  bg: "#0C0E12", card: "#14171E", border: "#242936", borderLight: "#2E3448",
  text: "#E8ECF4", textMuted: "#8891A5", textDim: "#5A6278",
  accent: "#D4883A", accentDim: "rgba(212,136,58,0.15)",
  green: "#3DB87A", greenDim: "rgba(61,184,122,0.15)",
  red: "#E05252", redDim: "rgba(224,82,82,0.15)",
  blue: "#4A8FE7", blueDim: "rgba(74,143,231,0.15)",
  purple: "#9B7ADB", purpleDim: "rgba(155,122,219,0.15)",
  chartGrid: "#1E2230",
};

const DEFAULT_CF = [
  { year: 1, calls: 6383, distributions: 495 },
  { year: 2, calls: 1213, distributions: 1280 },
  { year: 3, calls: 493, distributions: 1376 },
  { year: 4, calls: 244, distributions: 3463 },
  { year: 5, calls: 201, distributions: 3412 },
  { year: 6, calls: 157, distributions: 3354 },
  { year: 7, calls: 288, distributions: 286 },
  { year: 8, calls: 288, distributions: 286 },
  { year: 9, calls: 246, distributions: 215 },
  { year: 10, calls: 204, distributions: 141 },
  { year: 11, calls: 145, distributions: 45 },
  { year: 12, calls: 136, distributions: 29 },
];
const DEFAULT_MULT = { stress: 0.30, unfavorable: 0.84, moderate: 1.44, favorable: 1.79 };
const STORAGE_KEY = "turnstone-liquidity-tool:v1";

const fmtE = (v) => { if (Math.abs(v) >= 1e6) return `€${(v/1e6).toFixed(1)}M`; if (Math.abs(v) >= 1e3) return `€${(v/1e3).toFixed(0)}k`; return `€${v.toFixed(0)}`; };

const font = "'DM Sans', sans-serif";
const serif = "'Instrument Serif', serif";

const Stat = ({ label, value, sub, color }) => (
  <div style={{ flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, fontFamily: font }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || C.text, fontFamily: serif, letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Slider = ({ label, value, onChange, min, max, step, format, help }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
      <label style={{ fontSize: 12, color: C.textMuted, fontFamily: font, letterSpacing: "0.04em" }}>{label}</label>
      <span style={{ fontSize: 15, fontWeight: 600, color: C.accent, fontFamily: serif }}>{format ? format(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: C.accent, height: 4, cursor: "pointer" }} />
    {help && <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>{help}</div>}
  </div>
);

const Toggle = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 2, background: C.bg, borderRadius: 8, padding: 3, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)} style={{
        padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
        fontWeight: value === o.value ? 600 : 400, background: value === o.value ? C.accent : "transparent",
        color: value === o.value ? "#fff" : C.textMuted, fontFamily: font, transition: "all 0.2s", letterSpacing: "0.02em",
      }}>{o.label}</button>
    ))}
  </div>
);

const Switch = ({ label, checked, onChange, help }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <label style={{ fontSize: 12, color: C.textMuted, fontFamily: font, letterSpacing: "0.04em", lineHeight: 1.4 }}>{label}</label>
      <div onClick={() => onChange(!checked)} style={{
        width: 40, height: 22, borderRadius: 11, background: checked ? C.accent : C.border,
        cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </div>
    </div>
    {help && <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>{help}</div>}
  </div>
);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.text, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", fontFamily: font }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: C.textMuted, fontSize: 11 }}>År {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 2 }}>
          <span style={{ color: p.color || C.textMuted }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{fmtE(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const NumInput = ({ value, onChange, style: s }) => (
  <input type="number" value={value} onChange={e => onChange(Number(e.target.value) || 0)}
    style={{ width: 64, padding: "4px 6px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11, fontFamily: font, textAlign: "right", outline: "none", ...s }}
    onFocus={e => { e.target.style.borderColor = C.accent; }} onBlur={e => { e.target.style.borderColor = C.border; }} />
);

function TurnstoneLiquidityTool() {
  const [commitment, setCommitment] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return 500000;
    try { return JSON.parse(saved).commitment ?? 500000; } catch { return 500000; }
  });
  const [parkRet, setParkRet] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return 0.04;
    try { return JSON.parse(saved).parkRet ?? 0.04; } catch { return 0.04; }
  });
  const [credRate, setCredRate] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return 0.055;
    try { return JSON.parse(saved).credRate ?? 0.055; } catch { return 0.055; }
  });
  const [strat, setStrat] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return "parking";
    try { return JSON.parse(saved).strat ?? "parking"; } catch { return "parking"; }
  });
  const [scen, setScen] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return "moderate";
    try { return JSON.parse(saved).scen ?? "moderate"; } catch { return "moderate"; }
  });
  const [cumul, setCumul] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return true;
    try { return JSON.parse(saved).cumul ?? true; } catch { return true; }
  });
  const [reinvest, setReinvest] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return true;
    try { return JSON.parse(saved).reinvest ?? true; } catch { return true; }
  });
  const [repayDist, setRepayDist] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return true;
    try { return JSON.parse(saved).repayDist ?? true; } catch { return true; }
  });
  const [showDetails, setShowDetails] = useState(false);
  const [cfs, setCfs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_CF.map(c => ({ ...c }));
    try { return JSON.parse(saved).cfs ?? DEFAULT_CF.map(c => ({ ...c })); } catch { return DEFAULT_CF.map(c => ({ ...c })); }
  });
  const [mults, setMults] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_MULT };
    try { return JSON.parse(saved).mults ?? { ...DEFAULT_MULT }; } catch { return { ...DEFAULT_MULT }; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ commitment, parkRet, credRate, strat, scen, cumul, reinvest, repayDist, cfs, mults }));
  }, [commitment, parkRet, credRate, strat, scen, cumul, reinvest, repayDist, cfs, mults]);

  const updCf = useCallback((i, f, v) => { setCfs(p => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; }); }, []);
  const updMult = useCallback((k, v) => { setMults(p => ({ ...p, [k]: v })); }, []);
  const resetCf = useCallback(() => { setCfs(DEFAULT_CF.map(c => ({ ...c }))); setMults({ ...DEFAULT_MULT }); }, []);

  const scenLabels = { stress: "Stress", unfavorable: "Ufordelaktig", moderate: "Moderat", favorable: "Fordelaktig" };
  const scale = commitment / 10000;

  const data = useMemo(() => {
    let parkBal = commitment, credDrw = 0, totCall = 0, totDist = 0, totParkInc = 0, totCredCost = 0, cumNet = 0;
    const totBaseDist = cfs.reduce((s, c) => s + c.distributions, 0);
    const targetDist = 10000 * mults[scen];
    const distMult = totBaseDist > 0 ? targetDist / totBaseDist : 0;

    return cfs.map(cf => {
      const calls = cf.calls * scale;
      const dist = cf.distributions * distMult * scale;
      totCall += calls; totDist += dist;
      let parkInc = 0, credCost = 0, fromPark = 0, draw = 0, repay = 0;

      if (strat === "parking") {
        parkInc = parkBal * parkRet; totParkInc += parkInc; parkBal += parkInc;
        const sell = Math.min(calls, parkBal); parkBal -= sell; fromPark = sell;
        if (reinvest) parkBal += dist;
      } else if (strat === "credit") {
        draw = calls; credDrw += draw;
        if (repayDist) { repay = Math.min(dist, credDrw); credDrw -= repay; }
        credCost = credDrw * credRate; totCredCost += credCost;
      } else {
        parkInc = parkBal * parkRet; totParkInc += parkInc; parkBal += parkInc;
        const sell = Math.min(calls, parkBal); parkBal -= sell; fromPark = sell;
        if (sell < calls) { draw = calls - sell; credDrw += draw; }
        if (repayDist && credDrw > 0) {
          repay = Math.min(dist, credDrw); credDrw -= repay;
          if (reinvest) parkBal += (dist - repay);
        } else if (reinvest) { parkBal += dist; }
        credCost = credDrw * credRate; totCredCost += credCost;
      }
      cumNet += (dist - calls);
      return {
        year: cf.year, yearLabel: `${cf.year}`, calls: -calls, distributions: dist,
        netCashFlow: dist - calls, cumNetCashFlow: cumNet,
        parkingBalance: Math.max(0, parkBal), parkingIncome: parkInc,
        creditDrawn: credDrw, creditCost: credCost, repayment: repay,
        totalCalls: totCall, totalDistributions: totDist, totalParkingIncome: totParkInc, totalCreditCost: totCredCost,
        capitalAtRisk: strat === "parking" ? (commitment - parkBal) : strat === "credit" ? credDrw : (commitment - parkBal + credDrw),
      };
    });
  }, [commitment, parkRet, credRate, strat, scen, scale, reinvest, repayDist, cfs, mults]);

  const last = data[data.length - 1];
  const peakRisk = Math.max(...data.map(d => Math.abs(d.capitalAtRisk)));
  const avgDepl = data.reduce((s, d) => s + Math.abs(d.capitalAtRisk), 0) / data.length;
  const totRet = last.totalDistributions - last.totalCalls + last.totalParkingIncome - last.totalCreditCost;
  const retPct = totRet / commitment;
  const effMult = last.totalCalls > 0 ? (last.totalDistributions + last.totalParkingIncome - last.totalCreditCost) / last.totalCalls : 0;

  const resetAll = useCallback(() => {
    setCommitment(500000);
    setParkRet(0.04);
    setCredRate(0.055);
    setStrat("parking");
    setScen("moderate");
    setCumul(true);
    setReinvest(true);
    setRepayDist(true);
    setShowDetails(false);
    resetCf();
    localStorage.removeItem(STORAGE_KEY);
  }, [resetCf]);

  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 };
  const cCard = { ...card, padding: "20px 24px" };
  const secT = { fontSize: 13, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px", fontWeight: 500 };
  const chT = { fontSize: 15, fontFamily: serif, margin: "0 0 16px", fontWeight: 400 };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${C.card} 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, padding: "28px 32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
              <span style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.12em", textTransform: "uppercase" }}>Pensum Asset Management</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 400, fontFamily: serif, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Likviditetsstyring<span style={{ color: C.accent }}> — </span><span style={{ color: C.textMuted }}>Turnstone PEF IV Feeder</span>
            </h1>
            <p style={{ fontSize: 13, color: C.textDim, margin: "6px 0 0", maxWidth: 600 }}>
              Visualiser kapitalflyten og optimaliser din likviditetsstrategi. Kapitalen parkeres i fond mellom innkallinger.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={resetAll} style={{ background: "transparent", color: C.textMuted, border: `1px solid ${C.borderLight}`, borderRadius: 8, cursor: "pointer", fontSize: 12, padding: "8px 12px" }}>Nullstill</button>
            <Toggle options={[{value:"stress",label:"Stress"},{value:"unfavorable",label:"Ufordelaktig"},{value:"moderate",label:"Moderat"},{value:"favorable",label:"Fordelaktig"}]} value={scen} onChange={setScen} />
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Innskuddsforpliktelse", value: fmtE(commitment), color: C.text, sub: "Total kommittering" },
            { label: "Netto avkastning", value: fmtE(totRet), color: totRet >= 0 ? C.green : C.red, sub: `${(retPct*100).toFixed(1)}% av kommittering` },
            { label: "Maks kapital bundet", value: fmtE(peakRisk), color: C.accent, sub: `${((peakRisk/commitment)*100).toFixed(0)}% av kommittering` },
            { label: "Snitt kapital bundet", value: fmtE(avgDepl), color: C.blue, sub: `${((avgDepl/commitment)*100).toFixed(0)}% av kommittering` },
            { label: "Effektiv multippel", value: `${effMult.toFixed(2)}x`, color: C.purple, sub: "Inkl. parkerings-/låneeffekter" },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}><Stat {...s} /></div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={card}>
              <h3 style={secT}>Investeringsparametere</h3>
              <Slider label="Innskuddsforpliktelse" value={commitment} onChange={setCommitment} min={100000} max={2000000} step={50000} format={fmtE} help="Minimum EUR 100.000" />
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>Likviditetsstrategi</label>
                <Toggle options={[{value:"parking",label:"Parkeringsfond"},{value:"credit",label:"Lånefinansiering"},{value:"combined",label:"Kombinert"}]} value={strat} onChange={setStrat} />
              </div>
            </div>

            <div style={card}>
              <h3 style={secT}>Avkastning & renter</h3>
              {(strat === "parking" || strat === "combined") && <Slider label="Avkastning parkeringsfond" value={parkRet} onChange={setParkRet} min={0.01} max={0.10} step={0.005} format={v=>`${(v*100).toFixed(1)}%`} help="Forventet årlig avkastning på parkert kapital" />}
              {(strat === "credit" || strat === "combined") && <Slider label="Lånerente (margin + referanse)" value={credRate} onChange={setCredRate} min={0.02} max={0.10} step={0.0025} format={v=>`${(v*100).toFixed(2)}%`} help="Effektiv rente på låneramme" />}
            </div>

            <div style={card}>
              <h3 style={secT}>Håndtering av utdelinger</h3>
              {(strat === "parking" || strat === "combined") && <Switch label="Reinvester utdelinger i parkeringsfond" checked={reinvest} onChange={setReinvest} help="Utdelinger fra Turnstone plasseres tilbake i parkeringsfondet" />}
              {(strat === "credit" || strat === "combined") && <Switch label="Nedbetal lån med utdelinger" checked={repayDist} onChange={setRepayDist} help="Utdelinger fra Turnstone brukes til å nedbetale utestående lån" />}
              <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5, padding: "8px 10px", background: C.bg, borderRadius: 8 }}>
                {strat === "parking" && (reinvest ? "↻ Utdelinger plasseres tilbake i parkeringsfondet og fortsetter å gi avkastning." : "↓ Utdelinger tas ut. Parkeringsfondet tæres ned over tid.")}
                {strat === "credit" && (repayDist ? "↻ Utdelinger nedbetaler utestående lån og reduserer rentekostnader." : "↓ Utdelinger tas ut — lånet nedbetales ikke. Rentekostnaden forblir høy.")}
                {strat === "combined" && (
                  repayDist && reinvest ? "↻ Utdelinger nedbetaler lån først, overskudd reinvesteres i parkeringsfondet."
                  : repayDist ? "↻ Utdelinger nedbetaler lån, men reinvesteres ikke i parkeringsfondet."
                  : reinvest ? "↻ Utdelinger reinvesteres i parkeringsfondet, men nedbetaler ikke lån."
                  : "↓ Utdelinger tas ut — verken reinvestering eller nedbetaling."
                )}
              </div>
            </div>

            <div style={{ background: C.accentDim, border: `1px solid ${C.accent}33`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 8 }}>
                {strat === "parking" ? "💡 Parkeringsfond" : strat === "credit" ? "💡 Lånefinansiering" : "💡 Kombinert strategi"}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                {strat === "parking" && "Kapitalen plasseres i et rente- eller aksjefond. Ved innkalling selges andeler for å dekke kravet. Du opprettholder avkastning på uinvestert kapital."}
                {strat === "credit" && "Innkallinger dekkes ved å trekke på en låneramme. Distribusjoner kan brukes til å nedbetale gjeld."}
                {strat === "combined" && "Kapital parkeres i fond, supplert med en låneramme som buffer. Parkeringsfondet brukes først, lånerammen ved behov."}
              </div>
            </div>

            {/* Fund Details */}
            <div style={{ ...card, padding: 20, borderColor: showDetails ? C.accent+"66" : C.border, transition: "border-color 0.3s" }}>
              <div onClick={() => setShowDetails(!showDetails)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: showDetails ? 16 : 0 }}>
                <h3 style={{ ...secT, margin: 0 }}>Turnstone PEF IV — Detaljer</h3>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`, transform: showDetails ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", fontSize: 12, color: C.textMuted }}>▼</div>
              </div>
              {!showDetails && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {[["Mål netto IRR",">17%"],["Mål TVPI (moderat)",`${mults.moderate.toFixed(2)}x`],["Fondets levetid",`${cfs.length} år (+3)`],["Forvaltningshonorar","1% + 1.25%"],["Carried interest","12.5% / 15%"],["Preferred return","8%"]].map(([k,v],i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: C.textDim }}>{k}</span><span style={{ fontWeight: 600, color: C.text }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 4, fontStyle: "italic" }}>Klikk for å redigere kontantstrømmer og scenariomultiplikatorer</div>
                </div>
              )}
              {showDetails && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Scenariomultiplikatorer (TVPI)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {Object.entries(scenLabels).map(([k,l]) => (
                        <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 11, color: k === scen ? C.accent : C.textDim, fontWeight: k === scen ? 600 : 400 }}>{l}</span>
                          <NumInput value={mults[k]} onChange={v => updMult(k,v)} style={{ width: 56 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Kontantstrømmer (per EUR 10.000)</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ padding: "6px 4px", textAlign: "center", color: C.textDim, fontWeight: 500 }}>År</th>
                        <th style={{ padding: "6px 4px", textAlign: "center", color: C.red, fontWeight: 500 }}>Innkalling</th>
                        <th style={{ padding: "6px 4px", textAlign: "center", color: C.green, fontWeight: 500 }}>Utdeling</th>
                      </tr></thead>
                      <tbody>{cfs.map((cf, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                          <td style={{ padding: "4px", textAlign: "center", color: C.textMuted, fontWeight: 600 }}>{cf.year}</td>
                          <td style={{ padding: "4px", textAlign: "center" }}><NumInput value={cf.calls} onChange={v => updCf(i,"calls",v)} /></td>
                          <td style={{ padding: "4px", textAlign: "center" }}><NumInput value={cf.distributions} onChange={v => updCf(i,"distributions",v)} /></td>
                        </tr>
                      ))}</tbody>
                      <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "6px 4px", textAlign: "center", color: C.textMuted, fontWeight: 700, fontSize: 10 }}>Sum</td>
                        <td style={{ padding: "6px 4px", textAlign: "center", color: C.red, fontWeight: 700, fontSize: 10 }}>{cfs.reduce((s,c)=>s+c.calls,0).toLocaleString()}</td>
                        <td style={{ padding: "6px 4px", textAlign: "center", color: C.green, fontWeight: 700, fontSize: 10 }}>{cfs.reduce((s,c)=>s+c.distributions,0).toLocaleString()}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                  <button onClick={resetCf} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: font, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.color = C.accent; }}
                    onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.textMuted; }}>
                    ↺ Tilbakestill til standard
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right - Charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ ...chT, margin: 0 }}>Kontantstrømmer over fondets levetid</h3>
                <Toggle options={[{value:false,label:"Årlig"},{value:true,label:"Kumulativ"}]} value={cumul} onChange={setCumul} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid} vertical={false} />
                  <XAxis dataKey="yearLabel" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtE} />
                  <Tooltip content={<Tip />} />
                  <ReferenceLine y={0} stroke={C.borderLight} />
                  {!cumul ? (<><Bar dataKey="calls" name="Innkallinger" radius={[4,4,0,0]} fill={C.red} opacity={0.85} /><Bar dataKey="distributions" name="Utdelinger" radius={[4,4,0,0]} fill={C.green} opacity={0.85} /></>) : (<Area type="monotone" dataKey="cumNetCashFlow" name="Kumulativ netto" fill={C.accentDim} stroke={C.accent} strokeWidth={2} />)}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={cCard}>
              <h3 style={chT}>{strat === "credit" ? "Utestående lån over tid" : strat === "combined" ? "Parkeringsfond & låneuttak" : "Saldo i parkeringsfond"}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid} vertical={false} />
                  <XAxis dataKey="yearLabel" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtE} />
                  <Tooltip content={<Tip />} />
                  {(strat === "parking" || strat === "combined") && <Area type="monotone" dataKey="parkingBalance" name="Parkeringsfond saldo" fill={C.blueDim} stroke={C.blue} strokeWidth={2} />}
                  {(strat === "credit" || strat === "combined") && <Area type="monotone" dataKey="creditDrawn" name="Utestående lån" fill={C.redDim} stroke={C.red} strokeWidth={2} />}
                  <Line type="monotone" dataKey="parkingIncome" name="Avkastning parkering" stroke={C.green} strokeWidth={1.5} dot={{ r: 3, fill: C.green }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={cCard}>
              <h3 style={chT}>Kapital faktisk bundet vs. kommittert</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid} vertical={false} />
                  <XAxis dataKey="yearLabel" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${((v/commitment)*100).toFixed(0)}%`} domain={[0, commitment]} />
                  <Tooltip content={<Tip />} />
                  <ReferenceLine y={commitment} stroke={C.textDim} strokeDasharray="6 4" label={{ value: "Kommittert", fill: C.textDim, fontSize: 10, position: "right" }} />
                  <Area type="monotone" dataKey="capitalAtRisk" name="Kapital bundet" fill={C.purpleDim} stroke={C.purple} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div style={{ ...cCard, overflow: "auto" }}>
              <h3 style={chT}>Detaljert årlig oversikt</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: font }}>
                <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["År","Innkalling","Utdeling","Netto",strat!=="credit"&&"Parkering",strat!=="credit"&&"Avk. park.",(strat==="credit"||strat==="combined")&&"Lån utst.",(strat==="credit"||strat==="combined")&&"Lånekostn.","Kapital bundet"].filter(Boolean).map((h,i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: "right", color: C.textDim, fontWeight: 500, fontSize: 11 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{data.map((d,i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: C.textMuted, fontWeight: 600 }}>{d.year}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: C.red }}>{fmtE(Math.abs(d.calls))}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: C.green }}>{fmtE(d.distributions)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, color: d.netCashFlow >= 0 ? C.green : C.red }}>{fmtE(d.netCashFlow)}</td>
                    {strat !== "credit" && <td style={{ padding: "7px 10px", textAlign: "right", color: C.blue }}>{fmtE(d.parkingBalance)}</td>}
                    {strat !== "credit" && <td style={{ padding: "7px 10px", textAlign: "right", color: C.green }}>{fmtE(d.parkingIncome)}</td>}
                    {(strat === "credit" || strat === "combined") && <td style={{ padding: "7px 10px", textAlign: "right", color: d.creditDrawn > 0 ? C.red : C.textDim }}>{fmtE(d.creditDrawn)}</td>}
                    {(strat === "credit" || strat === "combined") && <td style={{ padding: "7px 10px", textAlign: "right", color: C.red }}>{fmtE(d.creditCost)}</td>}
                    <td style={{ padding: "7px 10px", textAlign: "right", color: C.purple, fontWeight: 600 }}>{fmtE(d.capitalAtRisk)}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{ borderTop: `2px solid ${C.border}` }}>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: C.textMuted }}>Sum</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: C.red }}>{fmtE(Math.abs(last.totalCalls))}</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: C.green }}>{fmtE(last.totalDistributions)}</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: last.totalDistributions-last.totalCalls>=0?C.green:C.red }}>{fmtE(last.totalDistributions-last.totalCalls)}</td>
                  {strat !== "credit" && <td style={{ padding: "10px 10px", textAlign: "right" }}></td>}
                  {strat !== "credit" && <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: C.green }}>{fmtE(last.totalParkingIncome)}</td>}
                  {(strat === "credit" || strat === "combined") && <td style={{ padding: "10px 10px", textAlign: "right" }}></td>}
                  {(strat === "credit" || strat === "combined") && <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: C.red }}>{fmtE(last.totalCreditCost)}</td>}
                  <td style={{ padding: "10px 10px", textAlign: "right" }}></td>
                </tr></tfoot>
              </table>
            </div>

            {/* Bottom cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Parkeringsavkastning opptjent", val: last.totalParkingIncome, color: C.green },
                { label: "Lånekostnad total", val: last.totalCreditCost, color: last.totalCreditCost > 0 ? C.red : C.textDim },
                { label: "Netto likviditetseffekt", val: last.totalParkingIncome - last.totalCreditCost, color: last.totalParkingIncome - last.totalCreditCost >= 0 ? C.green : C.red },
              ].map((b,i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>{b.label}</div>
                  <div style={{ fontSize: 26, fontFamily: serif, color: b.color, fontWeight: 400, marginBottom: 4 }}>{fmtE(b.val)}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{((b.val/commitment)*100).toFixed(1)}% av kommittering</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, padding: "12px 16px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <strong style={{ color: C.textMuted }}>Viktig informasjon:</strong> Dette verktøyet er utarbeidet som et illustrasjons- og diskusjonsverktøy.
              Kontantstrømmene er basert på det {scenLabels[scen].toLowerCase()}e scenariet fra Turnstone PEF IV Feeder AS investorpresentasjon (januar 2026).
              Ingen garanti kan gis for at målsatt avkastning oppnås. Faktiske innkallinger og utdelinger vil avvike fra estimatene.
              Avkastning på parkeringsfond og lånekostnader er forenklede forutsetninger. Investeringsbeslutninger bør baseres på fondets offisielle dokumentasjon.
              Pensum Asset Management AS er tilrettelegger for Fondet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


ReactDOM.createRoot(document.getElementById("root")).render(<TurnstoneLiquidityTool />);
