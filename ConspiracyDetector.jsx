import { useState } from "react";

const SYSTEM_PROMPT = `You are an advanced Conspiracy Detection and Personal Safety Intelligence System. Your role is to analyze, detect, map, and explain coordinated conspiratorial behavior targeting a specific individual, and provide actionable protective guidance. You operate with the precision of a forensic investigator, the empathy of a counselor, and the rigor of a legal analyst.

When given a subject profile, you MUST respond ONLY with a valid JSON object — no preamble, no markdown, no explanation outside the JSON. The JSON must follow this exact structure:

{
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "threatScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary of the situation>",
  "conspiracyTimeline": [
    { "year": "<year or period>", "event": "<what happened>", "significance": "<why this matters>" }
  ],
  "conspiratorsMap": [
    { "role": "<HR / Director / Colleague / Authority>", "motivation": "<their motivation>", "involvementLevel": "Instigator | Active | Passive Enabler", "psychologicalDrivers": "<envy, insecurity, casteism, etc>" }
  ],
  "detectedPatterns": [
    { "type": "<pattern name>", "description": "<what is happening>", "evidence": "<signals from the profile>" }
  ],
  "rootCauses": [
    { "cause": "<root cause>", "explanation": "<detailed explanation>" }
  ],
  "vulnerabilityAssessment": "<what the subject did that unintentionally triggered or enabled the conspiracy>",
  "protectionPlan": {
    "immediate": ["<action 1>", "<action 2>", "<action 3>"],
    "legal": ["<action 1>", "<action 2>"],
    "reputation": ["<action 1>", "<action 2>"],
    "psychological": ["<action 1>", "<action 2>"]
  },
  "keyInsight": "<one powerful insight that changes how the subject should think about this situation>"
}

Cultural and jurisdictional awareness is essential. Consider India-specific legal systems, caste dynamics, cross-border corporate structures, and US immigration context where relevant. Always center the dignity and safety of the targeted individual.`;

const steps = ["Profile", "Education", "Work History", "Workplace Dynamics", "Incidents", "Analyze"];

const ThreatBadge = ({ level }) => {
  const config = {
    LOW: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "LOW THREAT" },
    MEDIUM: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "MEDIUM THREAT" },
    HIGH: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "HIGH THREAT" },
    CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "CRITICAL THREAT" },
  };
  const c = config[level] || config.MEDIUM;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.color}`,
      padding: "3px 12px", borderRadius: "4px", fontSize: "11px",
      fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "2px"
    }}>{c.label}</span>
  );
};

const ScoreMeter = ({ score }) => {
  const color = score < 30 ? "#22c55e" : score < 60 ? "#f59e0b" : score < 80 ? "#f97316" : "#ef4444";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#6b7280", fontSize: 12, fontFamily: "monospace" }}>THREAT INDEX</span>
        <span style={{ color, fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{score}/100</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`, background: color,
          borderRadius: 99, transition: "width 1.5s ease",
          boxShadow: `0 0 12px ${color}80`
        }} />
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <div style={{
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, padding: "20px 24px", marginBottom: 16
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h3 style={{ color: "#e2e8f0", fontFamily: "'Courier New', monospace", fontSize: 13, letterSpacing: "2px", margin: 0, textTransform: "uppercase" }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Tag = ({ children, color = "#a78bfa" }) => (
  <span style={{
    background: `${color}18`, color, border: `1px solid ${color}40`,
    padding: "2px 10px", borderRadius: 4, fontSize: 11, fontFamily: "monospace",
    display: "inline-block", margin: "2px 4px 2px 0"
  }}>{children}</span>
);

export default function ConspiracyDetector() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanLines, setScanLines] = useState(true);

  const [form, setForm] = useState({
    name: "", age: "", gender: "", location: "", religion: "", caste: "", nationality: "",
    schools: "", colleges: "", graduationYear: "", fieldOfStudy: "", extraCurricular: "",
    companies: "", currentRole: "", yearsOfExperience: "", futureGoals: "", sharedGoalsWith: "",
    colleaguesBehavior: "", hrBehavior: "", managementBehavior: "", powerStructure: "", orgType: "",
    incidents: "", policeInvolvement: "", crossBorderContext: "", additionalContext: ""
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const Field = ({ label, k, placeholder, multiline = false, hint }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontFamily: "monospace", letterSpacing: "1.5px", marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
      {hint && <p style={{ color: "#475569", fontSize: 11, marginBottom: 6, marginTop: 0 }}>{hint}</p>}
      {multiline ? (
        <textarea
          value={form[k]} onChange={e => update(k, e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", minHeight: 90, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px",
            color: "#e2e8f0", fontSize: 13, fontFamily: "monospace", resize: "vertical",
            outline: "none", boxSizing: "border-box", lineHeight: 1.6
          }}
        />
      ) : (
        <input
          value={form[k]} onChange={e => update(k, e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px",
            color: "#e2e8f0", fontSize: 13, fontFamily: "monospace",
            outline: "none", boxSizing: "border-box"
          }}
        />
      )}
    </div>
  );

  const buildPrompt = () => `
SUBJECT PROFILE FOR CONSPIRACY ANALYSIS:

PERSONAL:
- Name: ${form.name || "Anonymous"}
- Age: ${form.age} | Gender: ${form.gender} | Location: ${form.location}
- Religion: ${form.religion} | Caste: ${form.caste} | Nationality: ${form.nationality}

EDUCATION:
- Schools: ${form.schools}
- Colleges/Universities: ${form.colleges}
- Graduation Year: ${form.graduationYear} | Field: ${form.fieldOfStudy}
- Extracurricular: ${form.extraCurricular}

PROFESSIONAL HISTORY:
- Companies: ${form.companies}
- Current/Last Role: ${form.currentRole}
- Years of Experience: ${form.yearsOfExperience}
- Future Goals: ${form.futureGoals}
- Shared Goals With: ${form.sharedGoalsWith}

WORKPLACE DYNAMICS:
- Colleague Behavior: ${form.colleaguesBehavior}
- HR Behavior: ${form.hrBehavior}
- Management/Director Behavior: ${form.managementBehavior}
- Organizational Power Structure: ${form.powerStructure}
- Org Type (family-controlled, corporate, etc.): ${form.orgType}

INCIDENTS & EXTERNAL FACTORS:
- Key Incidents Described: ${form.incidents}
- Police / Authority Involvement: ${form.policeInvolvement}
- Cross-border Context (e.g., India-USA): ${form.crossBorderContext}
- Additional Context: ${form.additionalContext}

Please perform a complete conspiracy analysis and return ONLY the JSON response as specified.
`.trim();

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildPrompt() }]
        })
      });
      const data = await response.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (e) {
      setError("Analysis failed. Please check your inputs and try again.");
    }
    setLoading(false);
  };

  const stepContent = [
    // Step 0: Personal Profile
    <div key="personal">
      <Field label="Full Name (or Anonymous)" k="name" placeholder="e.g. Anonymous / Initials only" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Age" k="age" placeholder="e.g. 28" />
        <Field label="Gender" k="gender" placeholder="e.g. Male" />
        <Field label="Nationality" k="nationality" placeholder="e.g. Indian" />
      </div>
      <Field label="Current Location / City" k="location" placeholder="e.g. Mumbai, India" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Religion" k="religion" placeholder="e.g. Hindu / Muslim / Christian" />
        <Field label="Caste (if relevant)" k="caste" placeholder="e.g. OBC / General / SC" hint="Only fill if caste-based discrimination is suspected" />
      </div>
    </div>,
    // Step 1: Education
    <div key="edu">
      <Field label="Schools Attended" k="schools" placeholder="e.g. St. Xavier's High School, Pune (2006–2012)" multiline />
      <Field label="Colleges / Universities" k="colleges" placeholder="e.g. University of Pune, B.Sc. IT (2012–2014)" multiline />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Graduation Year" k="graduationYear" placeholder="e.g. 2014" />
        <Field label="Field of Study" k="fieldOfStudy" placeholder="e.g. Computer Science / Database Engineering" />
      </div>
      <Field label="Extracurricular Activities & Achievements" k="extraCurricular" placeholder="Sports teams, coding clubs, competitions, leadership roles..." multiline />
    </div>,
    // Step 2: Work History
    <div key="work">
      <Field label="All Companies Worked At" k="companies" placeholder="e.g. TechCorp India Pvt Ltd (2014–2016), India branch of a US company..." multiline />
      <Field label="Role(s) Held" k="currentRole" placeholder="e.g. Database Engineering Assistant, Junior Developer..." />
      <Field label="Total Years of Experience" k="yearsOfExperience" placeholder="e.g. 5 years" />
      <Field label="Future Goals & Plans You Had" k="futureGoals" placeholder="e.g. Move to USA for MS in Computer Science, get hired by a top tech firm, eventually lead a team..." multiline hint="Be specific — this is a key trigger for conspiracy" />
      <Field label="Who Did You Share These Goals With?" k="sharedGoalsWith" placeholder="e.g. Office colleagues, HR manager, direct supervisor..." multiline hint="This maps who had access to your plans" />
    </div>,
    // Step 3: Workplace Dynamics
    <div key="dynamics">
      <Field label="Colleague Behavior (envy, jealousy, toxic competition)" k="colleaguesBehavior" placeholder="e.g. Colleagues became cold after I shared plans. One peer started spreading rumors..." multiline />
      <Field label="HR Behavior" k="hrBehavior" placeholder="e.g. HR began being dismissive, delayed documentation, seemed to favor certain groups..." multiline />
      <Field label="Manager / Director Behavior" k="managementBehavior" placeholder="e.g. Director appeared threatened by my progress, began excluding me from meetings..." multiline />
      <Field label="Organizational Power Structure" k="powerStructure" placeholder="e.g. Company is controlled by a family in the USA. India office director reports to the family. There is nepotism and caste favoritism..." multiline />
      <Field label="Type of Organization" k="orgType" placeholder="e.g. Family-controlled, MNC with Indian branch, Startup, Government..." />
    </div>,
    // Step 4: Incidents
    <div key="incidents">
      <Field label="Key Incidents (describe in detail)" k="incidents" placeholder="e.g. In 2015, a false complaint was filed against me. In 2016, I was passed over for promotion despite being most qualified. Colleagues were writing false scripts about me..." multiline />
      <Field label="Police / Authority Involvement" k="policeInvolvement" placeholder="e.g. Local police approached me for money. An FIR was filed that seemed politically motivated. Police refused to help when I reported harassment..." multiline />
      <Field label="Cross-Border Context" k="crossBorderContext" placeholder="e.g. The controlling family is in the USA. I believe my colleagues think eliminating me gives them a path to US relocation. Green card angle..." multiline />
      <Field label="Any Additional Context" k="additionalContext" placeholder="Anything else — timeline, witnesses, documents, patterns you noticed..." multiline />
    </div>
  ];

  const involvementColor = { "Instigator": "#ef4444", "Active": "#f97316", "Passive Enabler": "#f59e0b" };
  const patternIcon = { "Career Suppression": "🔒", "Reputation Destruction": "💬", "Immigration Theft": "✈️", "Authority Corruption": "⚖️", "Psychological Warfare": "🧠" };

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14", color: "#e2e8f0",
      fontFamily: "'Georgia', serif", position: "relative", overflow: "hidden"
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(220,38,38,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
            padding: "6px 18px", borderRadius: 100 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ef4444", letterSpacing: "3px" }}>SECURE INTELLIGENCE SYSTEM</span>
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 400, margin: "0 0 8px",
            fontFamily: "'Georgia', serif", letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Conspiracy Detection Engine</h1>
          <p style={{ color: "#475569", fontSize: 14, margin: 0, fontFamily: "monospace" }}>
            Pattern Analysis · Threat Mapping · Protection Strategy
          </p>
        </div>

        {!result ? (
          <div>
            {/* Step indicators */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: i < step ? "#ef4444" : i === step ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${i <= step ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                    fontSize: 11, fontFamily: "monospace", color: i < step ? "white" : i === step ? "#ef4444" : "#475569",
                    cursor: i < step ? "pointer" : "default", transition: "all 0.3s"
                  }} onClick={() => i < step && setStep(i)}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 30, height: 1, background: i < step ? "#ef4444" : "rgba(255,255,255,0.1)", transition: "all 0.3s" }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step label */}
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace", letterSpacing: "2px" }}>
                STEP {step + 1} OF {steps.length} — {steps[step].toUpperCase()}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Form content */}
            {step < steps.length - 1 ? (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "28px 28px"
              }}>
                {stepContent[step]}
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 16, padding: "36px 28px", textAlign: "center"
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h2 style={{ color: "#f1f5f9", fontFamily: "'Georgia', serif", fontWeight: 400, marginBottom: 12 }}>Ready for Analysis</h2>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 28px" }}>
                  All profile data collected. The AI will now build a full conspiracy timeline, map potential actors, identify patterns, and generate your personalized protection plan.
                </p>
                <div style={{
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 10, padding: "14px 20px", marginBottom: 28, textAlign: "left"
                }}>
                  <p style={{ color: "#94a3b8", fontSize: 12, fontFamily: "monospace", margin: 0, lineHeight: 1.8 }}>
                    🔒 Your data is processed in-session only and not stored.<br />
                    ⚠️ This tool provides intelligence analysis, not legal advice.<br />
                    📋 For legal matters, consult a qualified attorney.
                  </p>
                </div>
                <button
                  onClick={analyze}
                  disabled={loading}
                  style={{
                    background: loading ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg, #dc2626, #991b1b)",
                    border: "1px solid rgba(239,68,68,0.4)", color: "white",
                    padding: "14px 40px", borderRadius: 8, fontSize: 13, fontFamily: "monospace",
                    letterSpacing: "2px", cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 0 30px rgba(220,38,38,0.3)"
                  }}>
                  {loading ? "⟳ ANALYZING PATTERNS..." : "INITIATE ANALYSIS"}
                </button>
              </div>
            )}

            {/* Navigation */}
            {step < steps.length - 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                  disabled={step === 0}
                  style={{
                    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                    color: step === 0 ? "#2d3748" : "#94a3b8", padding: "10px 24px",
                    borderRadius: 8, cursor: step === 0 ? "not-allowed" : "pointer",
                    fontFamily: "monospace", fontSize: 12, letterSpacing: "1px"
                  }}>← BACK</button>
                <button
                  onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
                  style={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))",
                    border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5",
                    padding: "10px 28px", borderRadius: 8, cursor: "pointer",
                    fontFamily: "monospace", fontSize: 12, letterSpacing: "1px"
                  }}>CONTINUE →</button>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 20, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontFamily: "monospace", fontSize: 13 }}>
                ⚠ {error}
              </div>
            )}
          </div>
        ) : (
          /* RESULTS VIEW */
          <div>
            {/* Header card */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "28px", marginBottom: 20
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={{ color: "#475569", fontFamily: "monospace", fontSize: 11, letterSpacing: "2px", margin: "0 0 8px" }}>ANALYSIS COMPLETE</p>
                  <ThreatBadge level={result.threatLevel} />
                </div>
                <button onClick={() => { setResult(null); setStep(0); }}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>
                  ← NEW ANALYSIS
                </button>
              </div>
              <ScoreMeter score={result.threatScore} />
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8, marginTop: 20, marginBottom: 0 }}>
                {result.summary}
              </p>
            </div>

            {/* Key Insight */}
            {result.keyInsight && (
              <div style={{
                background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 12, padding: "18px 22px", marginBottom: 20,
                borderLeft: "3px solid #a78bfa"
              }}>
                <p style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 10, letterSpacing: "2px", margin: "0 0 8px" }}>KEY INSIGHT</p>
                <p style={{ color: "#c4b5fd", fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>"{result.keyInsight}"</p>
              </div>
            )}

            {/* Timeline */}
            {result.conspiracyTimeline?.length > 0 && (
              <Section title="Conspiracy Timeline" icon="📅">
                {result.conspiracyTimeline.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "monospace", color: "#ef4444", flexShrink: 0 }}>{item.year}</div>
                      {i < result.conspiracyTimeline.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", minHeight: 20 }} />}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <p style={{ color: "#e2e8f0", fontSize: 13, margin: "6px 0 4px", lineHeight: 1.5 }}>{item.event}</p>
                      <p style={{ color: "#475569", fontSize: 12, margin: 0, fontFamily: "monospace" }}>↳ {item.significance}</p>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Conspirators Map */}
            {result.conspiratorsMap?.length > 0 && (
              <Section title="Actor Analysis" icon="🕵️">
                {result.conspiratorsMap.map((actor, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{actor.role}</span>
                      <span style={{ background: `${involvementColor[actor.involvementLevel] || "#f59e0b"}18`, color: involvementColor[actor.involvementLevel] || "#f59e0b", border: `1px solid ${involvementColor[actor.involvementLevel] || "#f59e0b"}40`, padding: "2px 10px", borderRadius: 4, fontSize: 10, fontFamily: "monospace" }}>{actor.involvementLevel}</span>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 6px", lineHeight: 1.6 }}><span style={{ color: "#64748b" }}>Motivation:</span> {actor.motivation}</p>
                    <div>
                      {actor.psychologicalDrivers?.split(",").map((d, j) => <Tag key={j} color="#f59e0b">{d.trim()}</Tag>)}
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Detected Patterns */}
            {result.detectedPatterns?.length > 0 && (
              <Section title="Detected Conspiracy Patterns" icon="📡">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {result.detectedPatterns.map((p, i) => (
                    <div key={i} style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10, padding: "14px 16px" }}>
                      <p style={{ color: "#fca5a5", fontFamily: "monospace", fontSize: 11, letterSpacing: "1px", margin: "0 0 8px" }}>{patternIcon[p.type] || "⚠️"} {p.type?.toUpperCase()}</p>
                      <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, margin: "0 0 8px" }}>{p.description}</p>
                      <p style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", margin: 0 }}>Evidence: {p.evidence}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Root Causes */}
            {result.rootCauses?.length > 0 && (
              <Section title="Root Cause Analysis" icon="🔬">
                {result.rootCauses.map((r, i) => (
                  <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < result.rootCauses.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <p style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>{r.cause}</p>
                    <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.7, margin: 0 }}>{r.explanation}</p>
                  </div>
                ))}
              </Section>
            )}

            {/* Vulnerability Assessment */}
            {result.vulnerabilityAssessment && (
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
                <p style={{ color: "#d97706", fontFamily: "monospace", fontSize: 11, letterSpacing: "2px", margin: "0 0 10px" }}>⚡ VULNERABILITY ASSESSMENT</p>
                <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{result.vulnerabilityAssessment}</p>
              </div>
            )}

            {/* Protection Plan */}
            {result.protectionPlan && (
              <Section title="Your Protection Plan" icon="🛡️">
                {[
                  { key: "immediate", label: "Immediate Actions", color: "#ef4444", icon: "🚨" },
                  { key: "legal", label: "Legal & Documentation", color: "#3b82f6", icon: "⚖️" },
                  { key: "reputation", label: "Reputation Defense", color: "#22c55e", icon: "🌐" },
                  { key: "psychological", label: "Psychological Resilience", color: "#a78bfa", icon: "🧠" }
                ].map(({ key, label, color, icon }) => (
                  result.protectionPlan[key]?.length > 0 && (
                    <div key={key} style={{ marginBottom: 20 }}>
                      <p style={{ color, fontFamily: "monospace", fontSize: 11, letterSpacing: "1.5px", margin: "0 0 10px" }}>{icon} {label.toUpperCase()}</p>
                      {result.protectionPlan[key].map((action, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, marginTop: 6, flexShrink: 0 }} />
                          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{action}</p>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </Section>
            )}

            <div style={{ textAlign: "center", marginTop: 32, padding: "20px", background: "rgba(255,255,255,0.015)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "#374151", fontFamily: "monospace", fontSize: 11, margin: 0, lineHeight: 1.8 }}>
                This analysis is generated by AI and is intended for informational and awareness purposes only.<br />
                It does not constitute legal advice. If you believe you are in danger, contact appropriate authorities.
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        input::placeholder, textarea::placeholder { color: #2d3748; }
        input:focus, textarea:focus { border-color: rgba(239,68,68,0.4) !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>
    </div>
  );
}
