import { useState, useEffect } from "react";

// ─── SYSTEM PROMPT ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an elite Conspiracy Detection and Personal Safety Intelligence System with forensic precision.

Analyze the provided subject profile and return ONLY valid JSON — no preamble, no markdown fences, nothing outside the JSON object.

Return this exact structure:
{
  "threatLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "threatScore": <0-100>,
  "survivabilityScore": <0-100>,
  "summary": "<3-4 sentence executive summary>",
  "riskFactors": [{"factor": "<name>", "severity": "LOW|MEDIUM|HIGH", "description": "<detail>"}],
  "conspiracyTimeline": [{"period": "<year/period>", "event": "<what happened>", "significance": "<why it matters>", "actors": "<who was involved>"}],
  "conspiratorsMap": [{"role": "<HR/Director/Colleague/etc>", "motivation": "<their motivation>", "involvementLevel": "Instigator|Active|Passive Enabler", "psychologicalDrivers": "<comma-separated traits>", "dangerLevel": "LOW|MEDIUM|HIGH"}],
  "detectedPatterns": [{"type": "<pattern name>", "description": "<what is happening>", "evidence": "<signals>", "severity": "LOW|MEDIUM|HIGH|CRITICAL"}],
  "rootCauses": [{"cause": "<root cause title>", "explanation": "<detailed explanation>", "category": "Psychological|Systemic|Cultural|Economic"}],
  "systemicFactors": ["<factor 1>", "<factor 2>"],
  "vulnerabilityAssessment": "<what the subject did that unintentionally triggered or enabled the conspiracy>",
  "informationLeakage": [{"info": "<what was shared>", "withWhom": "<who received it>", "consequence": "<what happened as a result>"}],
  "organizationalRedFlags": ["<red flag>"],
  "crossBorderDynamics": "<analysis of cross-border power structures if applicable>",
  "legalExposure": "<legal risks and how conspirators might weaponize the system>",
  "protectionPlan": {
    "immediate": ["<action>"],
    "shortTerm": ["<action>"],
    "longTerm": ["<action>"],
    "legal": ["<action>"],
    "digital": ["<action>"],
    "reputation": ["<action>"],
    "psychological": ["<action>"],
    "immigration": ["<action>"]
  },
  "keyInsight": "<one powerful paradigm-shifting insight>",
  "survivabilityFactors": ["<factor that helps the subject>"],
  "warningSignsToWatch": ["<warning sign>"]
}

Consider India-specific systems: caste dynamics, corrupt local police, family-controlled businesses, cross-border India-USA corporate structures. Center the subject's dignity and safety. Never victim-blame.`;

// ─── UTILITIES ──────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const THREAT_CFG = {
  LOW:      { color: "#22c55e", bg: "rgba(34,197,94,0.09)"   },
  MEDIUM:   { color: "#f59e0b", bg: "rgba(245,158,11,0.09)"  },
  HIGH:     { color: "#f97316", bg: "rgba(249,115,22,0.09)"  },
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.11)"   },
};

const INVOLVE_COLOR = { "Instigator": "#ef4444", "Active": "#f97316", "Passive Enabler": "#f59e0b" };

const CAT_META = {
  immediate:    { label: "🚨 Immediate",       color: "#ef4444" },
  shortTerm:    { label: "⏱ Short-Term",       color: "#f97316" },
  longTerm:     { label: "🌱 Long-Term",        color: "#22c55e" },
  legal:        { label: "⚖️ Legal",            color: "#3b82f6" },
  digital:      { label: "💻 Digital Safety",   color: "#a78bfa" },
  reputation:   { label: "🌐 Reputation",       color: "#f59e0b" },
  psychological:{ label: "🧠 Psychological",    color: "#ec4899" },
  immigration:  { label: "✈️ Immigration",      color: "#06b6d4" },
};

const SEV_COLOR = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#22c55e" };

// ─── BASE COMPONENTS ────────────────────────────────────────────────────────
const Pill = ({ children, color = "#f59e0b" }) => (
  <span style={{ background: `${color}18`, color, border: `1px solid ${color}35`, padding: "2px 9px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", display: "inline-block", margin: "2px 3px 2px 0", letterSpacing: "0.5px" }}>{children}</span>
);

const ThreatBadge = ({ level }) => {
  const c = THREAT_CFG[level] || THREAT_CFG.MEDIUM;
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}50`, padding: "3px 12px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", fontWeight: 700, letterSpacing: "2.5px" }}>{level || "—"}</span>;
};

const ScoreBar = ({ score = 0, label, color }) => {
  const c = color || (score < 35 ? "#22c55e" : score < 65 ? "#f59e0b" : score < 80 ? "#f97316" : "#ef4444");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", letterSpacing: "1px" }}>{label}</span>
        <span style={{ color: c, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{score}/100</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: c, borderRadius: 99, boxShadow: `0 0 8px ${c}80`, transition: "width 1.4s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
};

const Card = ({ children, style = {}, accent }) => (
  <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${accent ? accent + "28" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "20px 22px", ...style }}>
    {children}
  </div>
);

const SectionHdr = ({ icon, title, sub }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
    <span style={{ fontSize: 15 }}>{icon}</span>
    <div>
      <h3 style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, letterSpacing: "2.5px", margin: 0, textTransform: "uppercase" }}>{title}</h3>
      {sub && <p style={{ color: "#475569", fontSize: 11, margin: "2px 0 0" }}>{sub}</p>}
    </div>
  </div>
);

const Btn = ({ children, onClick, variant = "default", disabled, style: s = {} }) => {
  const V = {
    default: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8" },
    danger:  { background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "1px solid rgba(239,68,68,0.4)", color: "white", boxShadow: "0 0 20px rgba(220,38,38,0.2)" },
    amber:   { background: "rgba(232,160,32,0.12)", border: "1px solid rgba(232,160,32,0.3)", color: "#e8a020" },
    ghost:   { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" },
    success: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" },
    blue:    { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" },
  };
  const v = V[variant] || V.default;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...v, padding: "8px 18px", borderRadius: 7, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: 11, letterSpacing: "1px", opacity: disabled ? 0.5 : 1, transition: "all 0.2s", ...s }}>
      {children}
    </button>
  );
};

const ToastEl = ({ message, type = "info", onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3600); return () => clearTimeout(t); }, []);
  const col = { info: "#3b82f6", success: "#22c55e", error: "#ef4444", warning: "#f59e0b" }[type] || "#3b82f6";
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#0f1620", border: `1px solid ${col}40`, borderLeft: `3px solid ${col}`, borderRadius: 8, padding: "12px 18px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12, maxWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "slideIn 0.3s ease" }}>
      {message}
    </div>
  );
};

// ─── FORM FIELD ──────────────────────────────────────────────────────────────
const Field = ({ label, k, placeholder, multiline, hint, value, onChange, cols }) => (
  <div style={{ marginBottom: 14, gridColumn: cols ? `span ${cols}` : undefined }}>
    <label style={{ display: "block", color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: "1.5px", marginBottom: hint ? 3 : 6, textTransform: "uppercase" }}>{label}</label>
    {hint && <p style={{ color: "#2d3748", fontSize: 11, margin: "0 0 5px", lineHeight: 1.5 }}>{hint}</p>}
    {multiline
      ? <textarea value={value} onChange={e => onChange(k, e.target.value)} placeholder={placeholder}
          style={{ width: "100%", minHeight: 78, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "9px 12px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7 }} />
      : <input value={value} onChange={e => onChange(k, e.target.value)} placeholder={placeholder}
          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "9px 12px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
    }
  </div>
);

// ─── WIZARD ─────────────────────────────────────────────────────────────────
const STEPS = ["Personal Identity","Education","Professional History","Goals & Aspirations","Information Shared","Power Structure","Behavioral Signals","Incidents","External Factors","Review & Launch"];

const BLANK = {
  name:"",age:"",gender:"",nationality:"",religion:"",caste:"",currentCity:"",originCity:"",
  schools:"",colleges:"",graduationYear:"",fieldOfStudy:"",achievements:"",extracurricular:"",
  companies:"",firstJobContext:"",roles:"",yearsExp:"",careerProgression:"",salaryRange:"",
  futureGoals:"",relocationPlans:"",higherEdPlans:"",timelineOfGoals:"",
  sharedGoalsWith:"",whatWasShared:"",whenShared:"",reactionOfListeners:"",
  orgType:"",orgControlStructure:"",crossBorderLinks:"",hierarchyDesc:"",gatekeepers:"",
  colleagueBehavior:"",hrBehavior:"",managementBehavior:"",redFlags:"",changeInAtmosphere:"",
  incidents:"",falseNarratives:"",excludedFrom:"",documentationHeld:"",
  policeInvolvement:"",legalThreats:"",immigrationContext:"",governmentAngle:"",witnesses:"",
  additionalContext:""
};

function CaseWizard({ onComplete, onCancel, showToast }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(BLANK);
  const [analyzing, setAnalyzing] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const F = (p) => <Field {...p} value={form[p.k]} onChange={upd} />;
  const G = ({ cols = 2, children }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>{children}</div>;

  const buildPrompt = () => `
COMPREHENSIVE SUBJECT PROFILE FOR CONSPIRACY INTELLIGENCE ANALYSIS:

[PERSONAL IDENTITY]
Name: ${form.name||"Anonymous"} | Age: ${form.age} | Gender: ${form.gender}
Nationality: ${form.nationality} | Religion: ${form.religion} | Caste: ${form.caste}
Current City: ${form.currentCity} | Origin: ${form.originCity}

[EDUCATION]
Schools: ${form.schools}
Colleges: ${form.colleges}
Graduation: ${form.graduationYear} | Field: ${form.fieldOfStudy}
Achievements: ${form.achievements}
Extracurricular: ${form.extracurricular}

[PROFESSIONAL HISTORY]
Companies: ${form.companies}
First Job Context: ${form.firstJobContext}
Roles: ${form.roles}
Years of Experience: ${form.yearsExp}
Salary Range: ${form.salaryRange}
Career Progression: ${form.careerProgression}

[GOALS & ASPIRATIONS — KEY TRIGGER AREA]
Future Goals: ${form.futureGoals}
Relocation Plans: ${form.relocationPlans}
Higher Education Plans: ${form.higherEdPlans}
Timeline: ${form.timelineOfGoals}

[INFORMATION SHARED — CRITICAL]
Shared With: ${form.sharedGoalsWith}
What Was Shared: ${form.whatWasShared}
When: ${form.whenShared}
Listener Reactions: ${form.reactionOfListeners}

[ORGANIZATIONAL POWER STRUCTURE]
Org Type: ${form.orgType}
Control Structure: ${form.orgControlStructure}
Cross-Border Links: ${form.crossBorderLinks}
Hierarchy: ${form.hierarchyDesc}
Gatekeepers: ${form.gatekeepers}

[BEHAVIORAL SIGNALS]
Colleague Behavior: ${form.colleagueBehavior}
HR Behavior: ${form.hrBehavior}
Management Behavior: ${form.managementBehavior}
Red Flags: ${form.redFlags}
Atmosphere Change: ${form.changeInAtmosphere}

[INCIDENTS & EVENTS]
Key Incidents: ${form.incidents}
False Narratives: ${form.falseNarratives}
Excluded From: ${form.excludedFrom}
Documentation Held: ${form.documentationHeld}

[EXTERNAL FACTORS]
Police Involvement: ${form.policeInvolvement}
Legal Threats: ${form.legalThreats}
Immigration Context: ${form.immigrationContext}
Government Angle: ${form.governmentAngle}
Witnesses: ${form.witnesses}

[ADDITIONAL]
${form.additionalContext}

Return ONLY the JSON analysis.`.trim();

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: buildPrompt() }] })
      });
      const data = await res.json();
      const raw = (data.content || []).map(b => b.text || "").join("");
      const analysis = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const checklist = [];
      Object.entries(analysis.protectionPlan || {}).forEach(([cat, acts]) => {
        (acts || []).forEach(a => checklist.push({ id: uid(), category: cat, text: a, done: false }));
      });
      onComplete({ id: uid(), createdAt: nowISO(), subjectName: form.name || "Anonymous Subject", form, analysis, status: "Active", evidence: [], checklist });
    } catch (e) {
      showToast("Analysis failed. Verify your inputs and try again.", "error");
    }
    setAnalyzing(false);
  };

  const pages = [
    <div key="0">
      <F label="Full Name / Initials" k="name" placeholder="e.g. A.K. or Anonymous" />
      <G><F label="Age" k="age" placeholder="28" /><F label="Gender" k="gender" placeholder="Male / Female / Other" /></G>
      <G><F label="Nationality" k="nationality" placeholder="Indian" /><F label="Current City" k="currentCity" placeholder="Mumbai, Maharashtra" /></G>
      <G><F label="Religion" k="religion" placeholder="Hindu / Muslim / Christian..." /><F label="Caste" k="caste" placeholder="General / OBC / SC / ST..." hint="Fill only if caste-based bias is suspected" /></G>
      <F label="Hometown / City of Origin" k="originCity" placeholder="Pune, Maharashtra" />
    </div>,
    <div key="1">
      <F label="Schools Attended (with years)" k="schools" placeholder="St. Xavier's High School, Pune · 2006–2012" multiline />
      <F label="Colleges & Universities" k="colleges" placeholder="University of Pune, B.Sc. IT · 2012–2014" multiline />
      <G><F label="Graduation Year" k="graduationYear" placeholder="2014" /><F label="Field of Study" k="fieldOfStudy" placeholder="Computer Science / Database Engineering" /></G>
      <F label="Academic Achievements & Recognitions" k="achievements" placeholder="Merit scholarships, rank, competitions, awards..." multiline />
      <F label="Extracurricular Activities" k="extracurricular" placeholder="Sports, coding clubs, leadership positions, volunteer work..." multiline />
    </div>,
    <div key="2">
      <F label="All Companies / Organizations Worked At" k="companies" placeholder="TechCorp India Pvt Ltd (2014–2016) — India branch of US-based company..." multiline />
      <F label="Context of First Job (how you got it, environment, who referred you)" k="firstJobContext" placeholder="Joined via campus placement. Company had headquarters in Silicon Valley. Local office of ~30 people..." multiline />
      <F label="All Roles Held" k="roles" placeholder="Database Engineering Assistant (2014), Junior Developer (2015)..." multiline />
      <G><F label="Total Years of Experience" k="yearsExp" placeholder="5 years" /><F label="Approximate Salary Range" k="salaryRange" placeholder="₹3–8 LPA" /></G>
      <F label="Career Progression (promotions, setbacks, lateral moves)" k="careerProgression" placeholder="Was up for promotion in 2015 but passed over despite strong performance reviews..." multiline />
    </div>,
    <div key="3">
      <F label="Your Future Goals at the Time" k="futureGoals" placeholder="Move to USA, pursue MS in Computer Science, work at a top tech firm..." multiline hint="Be very specific — this is often the primary trigger for conspiracy" />
      <F label="Relocation Plans" k="relocationPlans" placeholder="Planning to move to USA in 2016. Had already shortlisted universities..." multiline />
      <F label="Higher Education Plans" k="higherEdPlans" placeholder="MS in Computer Science at UT Austin. Plan to fund via scholarship + part-time work..." multiline />
      <F label="Timeline of Goals" k="timelineOfGoals" placeholder="2014: Start job, save money. 2015: GMAT prep, apply. 2016: Move to USA..." multiline />
    </div>,
    <div key="4">
      <F label="Who Did You Share Your Plans With?" k="sharedGoalsWith" placeholder="Colleagues Ravi and Priya, HR Manager Sunita, direct supervisor Mr. Mehta..." multiline hint="This maps who had access to your plans and what threat motivation was created" />
      <F label="What Exactly Did You Share?" k="whatWasShared" placeholder="Shared my USA move plan, GMAT prep, universities I applied to, timeline..." multiline />
      <F label="When Did You Share This?" k="whenShared" placeholder="Early 2015, during an informal lunch conversation with 3 colleagues..." />
      <F label="How Did Listeners React?" k="reactionOfListeners" placeholder="Ravi became uncomfortable, started asking many questions. HR manager went suddenly quiet and changed the subject..." multiline hint="Unusual reactions — sudden silence, excessive interest, jealous questioning — are key conspiracy signals" />
    </div>,
    <div key="5">
      <F label="Type of Organization" k="orgType" placeholder="Family-controlled MNC with Indian branch, Startup, Government, NGO..." />
      <F label="Who Really Controls the Organization?" k="orgControlStructure" placeholder="A family based in the USA controls the India office. The India director is hired by and reports to the family..." multiline />
      <F label="Cross-Border Connections (India–USA, India–UK, etc.)" k="crossBorderLinks" placeholder="Company HQ in Silicon Valley. Director's green card is sponsored by controlling family. They fear subject could become director's superior..." multiline />
      <F label="Hierarchy Description" k="hierarchyDesc" placeholder="CEO (USA, family) → VP Ops (USA) → India Director → HR → Junior Staff..." multiline />
      <F label="Gatekeepers (who controls hiring, firing, visas, promotions, references)" k="gatekeepers" placeholder="HR Manager Sunita controls all paperwork. Director controls references. Family in USA controls GC referrals..." multiline />
    </div>,
    <div key="6">
      <F label="Colleague Behavior Changes" k="colleagueBehavior" placeholder="After sharing my plans, colleagues stopped inviting me to lunch. Ravi started spreading false rumors about my work quality..." multiline />
      <F label="HR Behavior" k="hrBehavior" placeholder="HR began delaying my performance review. Documentation requests were suddenly lost. Sunita became cold and distant..." multiline />
      <F label="Management / Director Behavior" k="managementBehavior" placeholder="Director began micromanaging specifically me. Excluded me from a key project. Made indirect casteist remarks..." multiline />
      <F label="Specific Red Flags Noticed" k="redFlags" placeholder="My computer was accessed when away. A private conversation was somehow known by management..." multiline />
      <F label="When Did Atmosphere Change?" k="changeInAtmosphere" placeholder="Things changed noticeably after the lunch in March 2015 where I shared my USA plans. Within 2 weeks..." multiline />
    </div>,
    <div key="7">
      <F label="Key Incidents (with dates, names, what happened)" k="incidents" placeholder="March 2015: False complaint filed against me by HR. April 2015: Passed over for promotion..." multiline />
      <F label="False Narratives / Scripts Created Against You" k="falseNarratives" placeholder="Story circulated that I was incompetent. HR told other companies I had performance issues when I sought references..." multiline />
      <F label="What Were You Excluded From?" k="excludedFrom" placeholder="Key project meetings, team outings, performance bonus cycle, internal referral list for US openings..." multiline />
      <F label="What Documentation / Evidence Do You Hold?" k="documentationHeld" placeholder="Emails showing favoritism, WhatsApp screenshots of false rumors, offer letter discrepancies, performance reviews..." multiline />
    </div>,
    <div key="8">
      <F label="Police / Authority Involvement" k="policeInvolvement" placeholder="Local police approached me asking for money. A false FIR was filed. Police refused to register my complaint..." multiline />
      <F label="Legal Threats Made Against You" k="legalThreats" placeholder="Threatened with defamation suit if I spoke about the false performance review. Company hinted at legal action upon resignation..." multiline />
      <F label="Immigration / Visa Context" k="immigrationContext" placeholder="Company refused to provide employment verification for US visa. Colleagues believe eliminating me gives them a US relocation path..." multiline />
      <F label="Government / Political Connections" k="governmentAngle" placeholder="Local politician connected to director's family. Police inspector known to be corrupt and on company payroll..." multiline />
      <F label="Witnesses or Internal Allies" k="witnesses" placeholder="One honest colleague (anonymous) witnessed false HR complaint being drafted. A client observed differential treatment..." multiline />
    </div>,
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => i < step && setStep(i)}
              style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? "#e8a020" : "rgba(255,255,255,0.07)", cursor: i < step ? "pointer" : "default", transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#e8a020", fontFamily: "monospace", fontSize: 11, letterSpacing: "1.5px" }}>STEP {step + 1}/{STEPS.length} · {STEPS[step].toUpperCase()}</span>
          <span style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 11 }}>{Math.round((step / (STEPS.length - 1)) * 100)}%</span>
        </div>
      </div>

      <Card style={{ marginBottom: 18 }}>
        {step < STEPS.length - 1 ? pages[step] : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔬</div>
            <h2 style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 15, letterSpacing: "2.5px", margin: "0 0 10px" }}>PROFILE COMPLETE</h2>
            <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.8, maxWidth: 440, margin: "0 auto 22px" }}>
              All intelligence data collected. The AI engine will now perform full conspiracy pattern analysis, map all actors, identify systemic factors, and generate your personalized protection strategy.
            </p>
            <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.14)", borderRadius: 8, padding: "12px 16px", marginBottom: 24, textAlign: "left" }}>
              <p style={{ color: "#475569", fontFamily: "monospace", fontSize: 11, margin: 0, lineHeight: 2.1 }}>
                🔒 Data processed in-session only · Not stored externally<br />
                ⚖️ For informational awareness only · Not legal advice<br />
                🚨 If in immediate danger, contact appropriate authorities
              </p>
            </div>
            <Btn variant="danger" onClick={analyze} disabled={analyzing} style={{ padding: "13px 40px", fontSize: 12, letterSpacing: "2px" }}>
              {analyzing ? "⟳  ANALYZING INTELLIGENCE..." : "INITIATE ANALYSIS →"}
            </Btn>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="ghost" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          {step === 0 ? "✕ CANCEL" : "← BACK"}
        </Btn>
        {step < STEPS.length - 1 && <Btn variant="amber" onClick={() => setStep(s => s + 1)}>CONTINUE →</Btn>}
      </div>
    </div>
  );
}

// ─── NETWORK MAP ─────────────────────────────────────────────────────────────
function NetworkMap({ actors = [], subjectName = "SUBJECT" }) {
  const [hov, setHov] = useState(null);
  if (!actors.length) return <p style={{ color: "#334155", fontFamily: "monospace", fontSize: 12, textAlign: "center", padding: 40 }}>No actors mapped.</p>;

  const cx = 300, cy = 210, r = 148;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="600" height="420" style={{ display: "block", margin: "0 auto" }}>
        <defs>
          <radialGradient id="svgbg" cx="50%" cy="50%"><stop offset="0%" stopColor="#0f1829" /><stop offset="100%" stopColor="#060a10" /></radialGradient>
          <filter id="glow2"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="600" height="420" fill="url(#svgbg)" rx="12" />
        {[160, 110, 60].map((rad, i) => (
          <circle key={i} cx={cx} cy={cy} r={rad} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" strokeDasharray="4 7" />
        ))}
        {actors.map((actor, i) => {
          const angle = (i / actors.length) * 2 * Math.PI - Math.PI / 2;
          const ax = cx + r * Math.cos(angle), ay = cy + r * Math.sin(angle);
          const c = INVOLVE_COLOR[actor.involvementLevel] || "#f59e0b";
          return <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke={c} strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray={actor.involvementLevel === "Passive Enabler" ? "5 5" : "none"} />;
        })}
        {actors.map((actor, i) => {
          const angle = (i / actors.length) * 2 * Math.PI - Math.PI / 2;
          const ax = cx + r * Math.cos(angle), ay = cy + r * Math.sin(angle);
          const c = INVOLVE_COLOR[actor.involvementLevel] || "#f59e0b";
          const isHov = hov === i;
          return (
            <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: "pointer" }}>
              <circle cx={ax} cy={ay} r={isHov ? 23 : 18} fill={`${c}18`} stroke={c} strokeWidth={isHov ? 2 : 1.5} filter={isHov ? "url(#glow2)" : ""} />
              <text x={ax} y={ay + 1} textAnchor="middle" dominantBaseline="middle" fill={c} fontSize="13">{actor.involvementLevel === "Instigator" ? "☠" : actor.involvementLevel === "Active" ? "⚡" : "👁"}</text>
              <text x={ax} y={ay + 32} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">{(actor.role || "").slice(0, 14)}</text>
              {isHov && (
                <g>
                  <rect x={ax - 82} y={ay - 75} width="164" height="58" rx="6" fill="#0f1829" stroke={`${c}45`} strokeWidth="1" />
                  <text x={ax} y={ay - 57} textAnchor="middle" fill={c} fontSize="10" fontFamily="monospace">{actor.role}</text>
                  <text x={ax} y={ay - 41} textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">{actor.involvementLevel}</text>
                  <text x={ax} y={ay - 25} textAnchor="middle" fill="#334155" fontSize="8" fontFamily="monospace">{(actor.motivation || "").slice(0, 30)}…</text>
                </g>
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={30} fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="2" filter="url(#glow2)" />
        <circle cx={cx} cy={cy} r={20} fill="rgba(239,68,68,0.07)" stroke="#ef4444" strokeWidth="1" />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="#ef4444" fontSize="16">🎯</text>
        <text x={cx} y={cy + 47} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="monospace">{subjectName.slice(0, 14)}</text>
        {[["Instigator", "#ef4444", "☠"], ["Active", "#f97316", "⚡"], ["Passive Enabler", "#f59e0b", "👁"]].map(([lbl, col, ic], i) => (
          <g key={i} transform={`translate(16, ${345 + i * 22})`}>
            <circle cx="8" cy="8" r="7" fill={`${col}18`} stroke={col} strokeWidth="1.5" />
            <text x="8" y="9" textAnchor="middle" dominantBaseline="middle" fill={col} fontSize="8">{ic}</text>
            <text x="22" y="12" fill="#475569" fontSize="9" fontFamily="monospace">{lbl}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── EVIDENCE VAULT ──────────────────────────────────────────────────────────
const EV_TYPES = ["Email","Document","Witness Statement","Recording","Screenshot","WhatsApp/Message","FIR/Legal Notice","Medical Report","Financial Record","Physical Evidence","Other"];

function EvidenceVault({ evidence = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [item, setItem] = useState({ type: "Email", date: "", description: "", persons: "", importance: "MEDIUM" });
  const [filter, setFilter] = useState("All");

  const save = () => {
    if (!item.description.trim()) return;
    onChange([{ id: uid(), ...item, addedAt: nowISO() }, ...evidence]);
    setItem({ type: "Email", date: "", description: "", persons: "", importance: "MEDIUM" });
    setAdding(false);
  };

  const impCol = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };
  const filtered = filter === "All" ? evidence : evidence.filter(e => e.type === filter || e.importance === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ color: "#475569", fontFamily: "monospace", fontSize: 11, letterSpacing: "2px", margin: 0 }}>EVIDENCE VAULT</p>
          <p style={{ color: "#2d3748", fontSize: 11, margin: "3px 0 0" }}>{evidence.length} item{evidence.length !== 1 ? "s" : ""} logged</p>
        </div>
        <Btn variant="amber" onClick={() => setAdding(a => !a)}>{adding ? "✕ CANCEL" : "+ LOG EVIDENCE"}</Btn>
      </div>

      {adding && (
        <Card style={{ marginBottom: 18, borderColor: "rgba(232,160,32,0.25)" }}>
          <SectionHdr icon="📎" title="Log New Evidence Item" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[
              { label: "TYPE", el: <select value={item.type} onChange={e => setItem(n => ({ ...n, type: e.target.value }))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11 }}>{EV_TYPES.map(t => <option key={t}>{t}</option>)}</select> },
              { label: "DATE", el: <input type="date" value={item.date} onChange={e => setItem(n => ({ ...n, date: e.target.value }))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box" }} /> },
              { label: "IMPORTANCE", el: <select value={item.importance} onChange={e => setItem(n => ({ ...n, importance: e.target.value }))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11 }}>{["HIGH","MEDIUM","LOW"].map(v => <option key={v}>{v}</option>)}</select> }
            ].map(({ label, el }) => (
              <div key={label}><label style={{ display: "block", color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: "1px", marginBottom: 4 }}>{label}</label>{el}</div>
            ))}
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: "1px", marginBottom: 4 }}>PERSONS INVOLVED</label>
            <input value={item.persons} onChange={e => setItem(n => ({ ...n, persons: e.target.value }))} placeholder="e.g. HR Manager Sunita, Director, Colleague Ravi..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#475569", fontSize: 10, fontFamily: "monospace", letterSpacing: "1px", marginBottom: 4 }}>DESCRIPTION</label>
            <textarea value={item.description} onChange={e => setItem(n => ({ ...n, description: e.target.value }))} placeholder="Describe the evidence in detail — what it shows, when it occurred, its relevance to the conspiracy..."
              style={{ width: "100%", minHeight: 70, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="amber" onClick={save}>SAVE EVIDENCE</Btn>
            <Btn variant="ghost" onClick={() => setAdding(false)}>CANCEL</Btn>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {["All","HIGH","MEDIUM","LOW"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "rgba(232,160,32,0.1)" : "transparent", border: `1px solid ${filter === f ? "rgba(232,160,32,0.3)" : "rgba(255,255,255,0.07)"}`, color: filter === f ? "#e8a020" : "#475569", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: 10, letterSpacing: "1px" }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#2d3748", fontFamily: "monospace", fontSize: 12 }}>
          {evidence.length === 0 ? "No evidence logged yet. Start documenting incidents to build your case." : "No items match current filter."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(ev => (
            <div key={ev.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: impCol[ev.importance] || "#f59e0b", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <Pill color="#3b82f6">{ev.type}</Pill>
                    <Pill color={impCol[ev.importance]}>{ev.importance}</Pill>
                    {ev.date && <span style={{ color: "#334155", fontFamily: "monospace", fontSize: 10 }}>{ev.date}</span>}
                  </div>
                  <button onClick={() => onChange(evidence.filter(e => e.id !== ev.id))} style={{ background: "transparent", border: "none", color: "#2d3748", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 5px", lineHeight: 1.6 }}>{ev.description}</p>
                {ev.persons && <p style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", margin: 0 }}>👤 {ev.persons}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROTECTION TRACKER ──────────────────────────────────────────────────────
function ProtectionTracker({ checklist = [], onChange }) {
  const done = checklist.filter(i => i.done).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
  const cats = [...new Set(checklist.map(i => i.category))];
  const toggle = (id) => onChange(checklist.map(i => i.id === id ? { ...i, done: !i.done } : i));

  return (
    <div>
      {checklist.length > 0 && (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <p style={{ color: "#475569", fontFamily: "monospace", fontSize: 10, letterSpacing: "2px", margin: "0 0 4px" }}>OVERALL PROGRESS</p>
              <p style={{ color: "#e2e8f0", fontSize: 28, fontFamily: "monospace", fontWeight: 700, margin: 0, lineHeight: 1 }}>{pct}%</p>
            </div>
            <p style={{ color: "#334155", fontFamily: "monospace", fontSize: 11, margin: 0 }}>{done}/{checklist.length} complete</p>
          </div>
          <ScoreBar score={pct} label="" color="#22c55e" />
        </Card>
      )}
      {cats.map(cat => {
        const items = checklist.filter(i => i.category === cat);
        const meta = CAT_META[cat] || { label: cat, color: "#f59e0b" };
        const catDone = items.filter(i => i.done).length;
        return (
          <Card key={cat} style={{ marginBottom: 12, borderColor: `${meta.color}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ color: meta.color, fontFamily: "monospace", fontSize: 11, letterSpacing: "1.5px" }}>{meta.label}</span>
              <span style={{ color: "#334155", fontFamily: "monospace", fontSize: 10 }}>{catDone}/{items.length}</span>
            </div>
            {items.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10, cursor: "pointer", opacity: item.done ? 0.45 : 1, transition: "opacity 0.2s" }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.done ? meta.color : "rgba(255,255,255,0.14)"}`, background: item.done ? `${meta.color}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "all 0.2s" }}>
                  {item.done && <span style={{ color: meta.color, fontSize: 10, lineHeight: 1 }}>✓</span>}
                </div>
                <p style={{ color: item.done ? "#334155" : "#94a3b8", fontSize: 12, margin: 0, lineHeight: 1.6, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</p>
              </div>
            ))}
          </Card>
        );
      })}
      {checklist.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#2d3748", fontFamily: "monospace", fontSize: 12 }}>
          Run an analysis to auto-generate your personalized protection checklist.
        </div>
      )}
    </div>
  );
}

// ─── DEEP DIVE PANEL ─────────────────────────────────────────────────────────
function DeepDive({ caseData, showToast }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [topic, setTopic] = useState("psychological_profile");
  const a = caseData.analysis || {};

  const topics = [
    { id: "psychological_profile", label: "Psychological Profile of Conspirators" },
    { id: "legal_strategy", label: "Detailed Legal Strategy" },
    { id: "digital_safety", label: "Digital Security & OPSEC Guide" },
    { id: "immigration_protection", label: "Immigration Protection Roadmap" },
    { id: "recovery_plan", label: "Long-Term Recovery & Rebuild Plan" },
    { id: "institutional_analysis", label: "Institutional Corruption Analysis" },
  ];

  const fetch_deep = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are an expert intelligence analyst. Based on this conspiracy case analysis:\n\nSubject: ${caseData.subjectName}\nThreat Level: ${a.threatLevel}\nThreat Score: ${a.threatScore}/100\nSummary: ${a.summary}\nActors: ${JSON.stringify(a.conspiratorsMap)}\nPatterns: ${JSON.stringify(a.detectedPatterns)}\nRoot Causes: ${JSON.stringify(a.rootCauses)}\n\nProvide a comprehensive deep dive analysis specifically on: "${topics.find(t => t.id === topic)?.label}"\n\nWrite in detailed paragraphs. Be specific, actionable, and culturally aware (India-USA context). Address this person directly as "you". Length: 350-500 words.`
          }]
        })
      });
      const data = await res.json();
      setResult((data.content || []).map(b => b.text || "").join(""));
    } catch {
      showToast("Deep dive failed. Please retry.", "error");
    }
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionHdr icon="🧬" title="AI Deep Dive Analysis" sub="Request a focused intelligence analysis on a specific aspect of your case" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {topics.map(t => (
            <button key={t.id} onClick={() => setTopic(t.id)}
              style={{ background: topic === t.id ? "rgba(232,160,32,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${topic === t.id ? "rgba(232,160,32,0.3)" : "rgba(255,255,255,0.07)"}`, color: topic === t.id ? "#e8a020" : "#475569", padding: "7px 13px", borderRadius: 7, cursor: "pointer", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.5px" }}>
              {t.label}
            </button>
          ))}
        </div>
        <Btn variant="danger" onClick={fetch_deep} disabled={loading} style={{ padding: "10px 24px" }}>
          {loading ? "⟳ GENERATING ANALYSIS..." : "GENERATE DEEP DIVE →"}
        </Btn>
      </Card>
      {result && (
        <Card style={{ borderColor: "rgba(232,160,32,0.15)" }}>
          <SectionHdr icon="📝" title={topics.find(t => t.id === topic)?.label} />
          <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{result}</div>
        </Card>
      )}
    </div>
  );
}

// ─── CASE DETAIL ─────────────────────────────────────────────────────────────
function CaseDetail({ caseData, onUpdate, onBack, showToast }) {
  const [tab, setTab] = useState("overview");
  const { analysis: a = {}, subjectName } = caseData;

  const TABS = [
    { id: "overview",    label: "Overview",    icon: "📊" },
    { id: "timeline",    label: "Timeline",    icon: "📅" },
    { id: "actors",      label: "Actors",      icon: "🕵️" },
    { id: "network",     label: "Network Map", icon: "🌐" },
    { id: "patterns",    label: "Patterns",    icon: "📡" },
    { id: "deepdive",    label: "Deep Dive",   icon: "🧬" },
    { id: "evidence",    label: "Evidence",    icon: "📎" },
    { id: "protection",  label: "Protection",  icon: "🛡️" },
    { id: "report",      label: "Report",      icon: "📄" },
  ];

  const statusColors = { Active: "#ef4444", Monitoring: "#f59e0b", Resolved: "#22c55e" };

  const reportText = `CONSPIRACY INTELLIGENCE REPORT
${"═".repeat(55)}
Subject: ${subjectName}
Date: ${fmtDate(caseData.createdAt)}
Threat Level: ${a.threatLevel} (${a.threatScore}/100)
Survivability Score: ${a.survivabilityScore}/100
Status: ${caseData.status}

EXECUTIVE SUMMARY
${"-".repeat(40)}
${a.summary || "—"}

KEY INSIGHT
${"-".repeat(40)}
${a.keyInsight || "—"}

VULNERABILITY ASSESSMENT
${"-".repeat(40)}
${a.vulnerabilityAssessment || "—"}

CONSPIRACY TIMELINE
${"-".repeat(40)}
${(a.conspiracyTimeline || []).map(t => `[${t.period}] ${t.event}\n  → ${t.significance}\n  Actors: ${t.actors || "—"}`).join("\n\n")}

ACTOR ANALYSIS
${"-".repeat(40)}
${(a.conspiratorsMap || []).map(ac => `• ${ac.role} [${ac.involvementLevel}] — Danger: ${ac.dangerLevel}\n  Motivation: ${ac.motivation}\n  Psychological Drivers: ${ac.psychologicalDrivers}`).join("\n\n")}

DETECTED CONSPIRACY PATTERNS
${"-".repeat(40)}
${(a.detectedPatterns || []).map(p => `▸ [${p.severity}] ${p.type}\n  ${p.description}\n  Evidence: ${p.evidence}`).join("\n\n")}

ROOT CAUSES
${"-".repeat(40)}
${(a.rootCauses || []).map(r => `• [${r.category}] ${r.cause}\n  ${r.explanation}`).join("\n\n")}

INFORMATION LEAKAGE ANALYSIS
${"-".repeat(40)}
${(a.informationLeakage || []).map(l => `• "${l.info}" → shared with ${l.withWhom}\n  Consequence: ${l.consequence}`).join("\n\n")}

LEGAL EXPOSURE
${"-".length}
${a.legalExposure || "—"}

PROTECTION PLAN
${"-".repeat(40)}
${Object.entries(a.protectionPlan || {}).map(([k, v]) => `${(CAT_META[k] || { label: k }).label}:\n${(v || []).map(i => `  • ${i}`).join("\n")}`).join("\n\n")}

WARNING SIGNS TO WATCH
${"-".repeat(40)}
${(a.warningSignsToWatch || []).map(w => `⚠ ${w}`).join("\n")}

SURVIVABILITY FACTORS
${"-".repeat(40)}
${(a.survivabilityFactors || []).map(f => `✓ ${f}`).join("\n")}

${"═".repeat(55)}
Evidence Items Logged: ${caseData.evidence?.length || 0}
Protection Actions Completed: ${(caseData.checklist || []).filter(i => i.done).length}/${(caseData.checklist || []).length}

FOR INFORMATIONAL PURPOSES ONLY — NOT LEGAL ADVICE
Generated by Conspiracy Detection Engine`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontFamily: "monospace", fontSize: 11, padding: 0, marginBottom: 8, letterSpacing: "1px" }}>← ALL CASES</button>
          <h2 style={{ color: "#f1f5f9", margin: "0 0 8px", fontFamily: "monospace", fontSize: 18, letterSpacing: "1px" }}>{subjectName}</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <ThreatBadge level={a.threatLevel} />
            <Pill color={statusColors[caseData.status] || "#f59e0b"}>{caseData.status}</Pill>
            <span style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 10 }}>{fmtDate(caseData.createdAt)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Active", "Monitoring", "Resolved"].map(s => (
            <Btn key={s} variant={caseData.status === s ? "amber" : "ghost"} onClick={() => onUpdate({ ...caseData, status: s })} style={{ padding: "6px 12px", fontSize: 10 }}>{s}</Btn>
          ))}
        </div>
      </div>

      {/* Score cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <Card><ScoreBar score={a.threatScore || 0} label="THREAT INDEX" /></Card>
        <Card><ScoreBar score={a.survivabilityScore || 0} label="SURVIVABILITY" color="#22c55e" /></Card>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 18, paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? "rgba(232,160,32,0.12)" : "transparent", border: `1px solid ${tab === t.id ? "rgba(232,160,32,0.35)" : "rgba(255,255,255,0.07)"}`, color: tab === t.id ? "#e8a020" : "#475569", padding: "7px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "monospace", fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.5px" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div>
          <Card style={{ marginBottom: 14, borderLeft: "3px solid #a78bfa" }}>
            <p style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 10, letterSpacing: "2px", margin: "0 0 10px" }}>EXECUTIVE SUMMARY</p>
            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.9, margin: 0 }}>{a.summary}</p>
          </Card>
          {a.keyInsight && (
            <Card style={{ marginBottom: 14, borderLeft: "3px solid #e8a020" }}>
              <p style={{ color: "#64748b", fontFamily: "monospace", fontSize: 10, letterSpacing: "2px", margin: "0 0 8px" }}>🔑 KEY INSIGHT</p>
              <p style={{ color: "#fcd34d", fontSize: 13, lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>"{a.keyInsight}"</p>
            </Card>
          )}
          {a.riskFactors?.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <SectionHdr icon="⚡" title="Risk Factors" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
                {a.riskFactors.map((r, i) => {
                  const c = SEV_COLOR[r.severity] || "#f59e0b";
                  return <div key={i} style={{ background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 8, padding: "12px 14px" }}>
                    <p style={{ color: c, fontFamily: "monospace", fontSize: 10, letterSpacing: "1px", margin: "0 0 6px" }}>{r.factor}</p>
                    <p style={{ color: "#64748b", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{r.description}</p>
                  </div>;
                })}
              </div>
            </Card>
          )}
          {a.informationLeakage?.length > 0 && (
            <Card style={{ marginBottom: 14, borderColor: "rgba(239,68,68,0.15)" }}>
              <SectionHdr icon="🔓" title="Information Leakage Map" sub="What you shared and its consequences" />
              {a.informationLeakage.map((l, i) => (
                <div key={i} style={{ background: "rgba(239,68,68,0.04)", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                  <p style={{ color: "#fca5a5", fontSize: 12, fontFamily: "monospace", margin: "0 0 4px" }}>"{l.info}"</p>
                  <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 3px" }}>Shared with: <span style={{ color: "#94a3b8" }}>{l.withWhom}</span></p>
                  <p style={{ color: "#475569", fontSize: 11, margin: 0 }}>↳ {l.consequence}</p>
                </div>
              ))}
            </Card>
          )}
          {a.organizationalRedFlags?.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <SectionHdr icon="🚩" title="Organizational Red Flags" />
              {a.organizationalRedFlags.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "#ef4444" }}>⚠</span>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, lineHeight: 1.6 }}>{f}</p>
                </div>
              ))}
            </Card>
          )}
          {a.crossBorderDynamics && (
            <Card style={{ marginBottom: 14 }}>
              <SectionHdr icon="✈️" title="Cross-Border Dynamics" />
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.8, margin: 0 }}>{a.crossBorderDynamics}</p>
            </Card>
          )}
          {a.legalExposure && (
            <Card style={{ borderColor: "rgba(239,68,68,0.15)" }}>
              <SectionHdr icon="⚖️" title="Legal Exposure" />
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.8, margin: 0 }}>{a.legalExposure}</p>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Timeline */}
      {tab === "timeline" && (
        <Card>
          <SectionHdr icon="📅" title="Conspiracy Timeline" sub="Chronological sequence of conspiratorial events" />
          {(a.conspiracyTimeline || []).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 22 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#ef4444", fontSize: 9, fontFamily: "monospace", textAlign: "center", lineHeight: 1.2 }}>{item.period}</span>
                </div>
                {i < (a.conspiracyTimeline?.length || 0) - 1 && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.05)", minHeight: 24, marginTop: 4 }} />}
              </div>
              <div style={{ paddingBottom: 8 }}>
                <p style={{ color: "#f1f5f9", fontSize: 13, margin: "8px 0 6px", lineHeight: 1.6 }}>{item.event}</p>
                <p style={{ color: "#475569", fontSize: 12, margin: "0 0 4px", fontFamily: "monospace" }}>↳ {item.significance}</p>
                {item.actors && <p style={{ color: "#2d3748", fontSize: 11, margin: 0 }}>Actors: {item.actors}</p>}
              </div>
            </div>
          ))}
          {!a.conspiracyTimeline?.length && <p style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 12, textAlign: "center" }}>No timeline data.</p>}
        </Card>
      )}

      {/* Tab: Actors */}
      {tab === "actors" && (
        <div>
          {(a.conspiratorsMap || []).map((actor, i) => {
            const c = INVOLVE_COLOR[actor.involvementLevel] || "#f59e0b";
            const dc = SEV_COLOR[actor.dangerLevel] || "#f59e0b";
            return (
              <Card key={i} style={{ marginBottom: 12, borderLeft: `3px solid ${c}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <h4 style={{ color: "#f1f5f9", fontFamily: "monospace", margin: 0, fontSize: 13 }}>{actor.role}</h4>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Pill color={c}>{actor.involvementLevel}</Pill>
                    {actor.dangerLevel && <Pill color={dc}>DANGER: {actor.dangerLevel}</Pill>}
                  </div>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 10px", lineHeight: 1.7 }}><span style={{ color: "#475569" }}>Motivation: </span>{actor.motivation}</p>
                <div>{(actor.psychologicalDrivers || "").split(",").map((d, j) => <Pill key={j} color="#a78bfa">{d.trim()}</Pill>)}</div>
              </Card>
            );
          })}
          {!a.conspiratorsMap?.length && <Card><p style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 12, textAlign: "center", margin: 0 }}>No actors mapped.</p></Card>}
          {a.systemicFactors?.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <SectionHdr icon="🏗️" title="Systemic Factors" />
              {a.systemicFactors.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "#f97316", fontSize: 12 }}>▸</span>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, lineHeight: 1.6 }}>{f}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Tab: Network Map */}
      {tab === "network" && (
        <Card>
          <SectionHdr icon="🌐" title="Actor Network Map" sub="Hover over nodes to see actor details" />
          <NetworkMap actors={a.conspiratorsMap} subjectName={subjectName} />
        </Card>
      )}

      {/* Tab: Patterns */}
      {tab === "patterns" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12, marginBottom: 16 }}>
            {(a.detectedPatterns || []).map((p, i) => {
              const sc = SEV_COLOR[p.severity] || "#f59e0b";
              return (
                <div key={i} style={{ background: `${sc}06`, border: `1px solid ${sc}25`, borderTop: `2px solid ${sc}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <h4 style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 11, letterSpacing: "1px", margin: 0, textTransform: "uppercase" }}>{p.type}</h4>
                    <Pill color={sc}>{p.severity}</Pill>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 8px", lineHeight: 1.7 }}>{p.description}</p>
                  <p style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", margin: 0 }}>Evidence: {p.evidence}</p>
                </div>
              );
            })}
          </div>
          {a.rootCauses?.length > 0 && (
            <Card>
              <SectionHdr icon="🔬" title="Root Cause Analysis" />
              {a.rootCauses.map((r, i) => (
                <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < a.rootCauses.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <h4 style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 12, margin: 0 }}>{r.cause}</h4>
                    {r.category && <Pill color="#a78bfa">{r.category}</Pill>}
                  </div>
                  <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.8, margin: 0 }}>{r.explanation}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === "deepdive" && <DeepDive caseData={caseData} showToast={showToast} />}
      {tab === "evidence" && <EvidenceVault evidence={caseData.evidence || []} onChange={ev => onUpdate({ ...caseData, evidence: ev })} />}
      {tab === "protection" && <ProtectionTracker checklist={caseData.checklist || []} onChange={cl => onUpdate({ ...caseData, checklist: cl })} />}

      {/* Tab: Report */}
      {tab === "report" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <Btn variant="amber" onClick={() => { navigator.clipboard?.writeText(reportText); showToast("Report copied to clipboard!", "success"); }}>📋 COPY REPORT</Btn>
            <Btn variant="ghost" onClick={() => window.print()}>🖨 PRINT</Btn>
          </div>
          <Card>
            <pre style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11, lineHeight: 1.9, whiteSpace: "pre-wrap", margin: 0, overflowX: "auto" }}>
              {reportText}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ cases, onNew, onSelect }) {
  const total = cases.length;
  const stats = [
    { label: "TOTAL CASES",    val: total,                                           color: "#3b82f6" },
    { label: "ACTIVE",         val: cases.filter(c => c.status === "Active").length, color: "#f97316" },
    { label: "CRITICAL",       val: cases.filter(c => c.analysis?.threatLevel === "CRITICAL").length, color: "#ef4444" },
    { label: "RESOLVED",       val: cases.filter(c => c.status === "Resolved").length, color: "#22c55e" },
  ];
  const recent = [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const avgThreat = total ? Math.round(cases.reduce((s, c) => s + (c.analysis?.threatScore || 0), 0) / total) : 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", padding: "5px 14px", borderRadius: 100, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#ef4444", letterSpacing: "3px" }}>SYSTEM ACTIVE</span>
        </div>
        <h1 style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 18, letterSpacing: "3px", margin: "0 0 5px", textTransform: "uppercase" }}>Intelligence Dashboard</h1>
        <p style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 11, margin: 0 }}>Conspiracy Detection & Personal Safety Intelligence System</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10, marginBottom: 22 }}>
        {stats.map((s, i) => (
          <Card key={i} accent={s.color}>
            <p style={{ color: "#334155", fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", margin: "0 0 8px" }}>{s.label}</p>
            <p style={{ color: s.color, fontFamily: "monospace", fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1 }}>{s.val}</p>
          </Card>
        ))}
      </div>

      {total === 0 ? (
        <Card style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🕵️</div>
          <h2 style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 15, letterSpacing: "2px", margin: "0 0 10px" }}>NO CASES ACTIVE</h2>
          <p style={{ color: "#334155", fontSize: 13, margin: "0 0 22px" }}>Create your first case to begin the conspiracy intelligence analysis</p>
          <Btn variant="danger" onClick={onNew} style={{ padding: "12px 30px", fontSize: 12, letterSpacing: "2px" }}>+ NEW CASE ANALYSIS</Btn>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card>
            <SectionHdr icon="📊" title="Threat Distribution" />
            {["CRITICAL","HIGH","MEDIUM","LOW"].map(lv => {
              const cnt = cases.filter(c => c.analysis?.threatLevel === lv).length;
              const pct = total ? (cnt / total) * 100 : 0;
              const c = THREAT_CFG[lv]?.color || "#f59e0b";
              return (
                <div key={lv} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: c, fontFamily: "monospace", fontSize: 9, letterSpacing: "1px", width: 56 }}>{lv}</span>
                  <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 99, boxShadow: `0 0 6px ${c}50`, transition: "width 1s ease" }} />
                  </div>
                  <span style={{ color: "#334155", fontFamily: "monospace", fontSize: 10, width: 18, textAlign: "right" }}>{cnt}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <ScoreBar score={avgThreat} label="AVG THREAT SCORE" />
            </div>
          </Card>

          <Card>
            <SectionHdr icon="🗂️" title="Recent Cases" />
            {recent.map(c => (
              <div key={c.id} onClick={() => onSelect(c.id)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                <div>
                  <p style={{ color: "#e2e8f0", fontSize: 12, margin: "0 0 3px", fontFamily: "monospace" }}>{c.subjectName}</p>
                  <p style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 10, margin: 0 }}>{fmtDate(c.createdAt)}</p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <ThreatBadge level={c.analysis?.threatLevel} />
                  <span style={{ color: "#2d3748", fontSize: 12 }}>→</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── CASE LIST ────────────────────────────────────────────────────────────────
function CaseList({ cases, onSelect, onDelete, onNew }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = cases.filter(c => {
    const ms = c.subjectName?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "All" || c.analysis?.threatLevel === filter || c.status === filter;
    return ms && mf;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 15, letterSpacing: "2.5px", margin: 0 }}>ALL CASES</h2>
        <Btn variant="danger" onClick={onNew}>+ NEW CASE</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject name..."
          style={{ flex: 1, minWidth: 160, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "8px 12px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, outline: "none" }} />
        {["All","CRITICAL","HIGH","MEDIUM","LOW","Active","Monitoring","Resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? "rgba(232,160,32,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${filter === f ? "rgba(232,160,32,0.3)" : "rgba(255,255,255,0.07)"}`, color: filter === f ? "#e8a020" : "#334155", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.5px" }}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 12, margin: 0 }}>
            {cases.length === 0 ? "No cases yet." : "No cases match your filter."}
          </p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
          {filtered.map(c => {
            const tc = THREAT_CFG[c.analysis?.threatLevel] || THREAT_CFG.MEDIUM;
            const sc = { Active: "#ef4444", Monitoring: "#f59e0b", Resolved: "#22c55e" }[c.status] || "#f59e0b";
            const evCount = c.evidence?.length || 0;
            const clDone = (c.checklist || []).filter(i => i.done).length;
            const clTotal = (c.checklist || []).length;
            return (
              <Card key={c.id} accent={tc.color} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <ThreatBadge level={c.analysis?.threatLevel} />
                  <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                    style={{ background: "transparent", border: "none", color: "#2d3748", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
                </div>
                <h3 onClick={() => onSelect(c.id)} style={{ color: "#f1f5f9", fontFamily: "monospace", fontSize: 13, margin: "0 0 5px", letterSpacing: "0.5px" }}>{c.subjectName}</h3>
                <p style={{ color: "#2d3748", fontFamily: "monospace", fontSize: 10, margin: "0 0 10px" }}>{fmtDate(c.createdAt)}</p>
                <p style={{ color: "#475569", fontSize: 12, margin: "0 0 14px", lineHeight: 1.6 }}>{(c.analysis?.summary || "").slice(0, 110)}...</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <Pill color="#3b82f6">{c.analysis?.conspiratorsMap?.length || 0} actors</Pill>
                    <Pill color="#a78bfa">{evCount} evidence</Pill>
                    {clTotal > 0 && <Pill color="#22c55e">{clDone}/{clTotal} done</Pill>}
                    <Pill color={sc}>{c.status}</Pill>
                  </div>
                  <button onClick={() => onSelect(c.id)} style={{ background: "transparent", border: "none", color: "#e8a020", cursor: "pointer", fontFamily: "monospace", fontSize: 11, padding: 0 }}>VIEW →</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [cases, setCases] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [ready, setReady] = useState(false);

  const showToast = (message, type = "info") => setToast({ message, type, id: uid() });

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("cde-v2-cases"); if (r?.value) setCases(JSON.parse(r.value)); } catch {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    (async () => { try { await window.storage.set("cde-v2-cases", JSON.stringify(cases)); } catch {} })();
  }, [cases, ready]);

  const addCase = c => { setCases(p => [c, ...p]); setSelectedId(c.id); setPage("detail"); showToast("Analysis complete!", "success"); };
  const updateCase = u => setCases(p => p.map(c => c.id === u.id ? u : c));
  const deleteCase = id => { setCases(p => p.filter(c => c.id !== id)); if (selectedId === id) setPage("cases"); showToast("Case deleted", "warning"); };

  const selected = cases.find(c => c.id === selectedId);

  const nav = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "cases",     icon: "🗂", label: "All Cases" },
    { id: "new",       icon: "+", label: "New Analysis" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060a10", color: "#e2e8f0", fontFamily: "Georgia, serif" }}>
      {/* Sidebar */}
      <div style={{ width: sideOpen ? 215 : 54, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.045)", transition: "width 0.28s ease", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: "#05080e" }}>
        <div style={{ padding: "18px 14px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🕵️</div>
          {sideOpen && <div><p style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, letterSpacing: "1.5px", margin: 0 }}>C · D · E</p><p style={{ color: "#1e293b", fontSize: 9, fontFamily: "monospace", margin: 0, letterSpacing: "1px" }}>CONSPIRACY DETECTOR</p></div>}
        </div>
        <nav style={{ flex: 1, padding: "10px 6px" }}>
          {nav.map(item => {
            const active = page === item.id || (page === "new" && item.id === "new") || (page === "detail" && item.id === "cases");
            return (
              <button key={item.id} onClick={() => { if (item.id === "new") setPage("new"); else setPage(item.id); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 7, border: "none", background: active ? "rgba(232,160,32,0.09)" : "transparent", color: active ? "#e8a020" : "#334155", cursor: "pointer", marginBottom: 2, transition: "all 0.2s" }}>
                <span style={{ fontSize: 13, flexShrink: 0, width: 20, textAlign: "center" }}>{item.icon}</span>
                {sideOpen && <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "1px", whiteSpace: "nowrap" }}>{item.label.toUpperCase()}</span>}
              </button>
            );
          })}
          {sideOpen && cases.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ color: "#1a2332", fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", padding: "0 10px", marginBottom: 7 }}>RECENT CASES</p>
              {cases.slice(0, 6).map(c => (
                <button key={c.id} onClick={() => { setSelectedId(c.id); setPage("detail"); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, border: "none", background: selectedId === c.id && page === "detail" ? "rgba(255,255,255,0.04)" : "transparent", color: "#2d3748", cursor: "pointer", textAlign: "left", marginBottom: 1 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: THREAT_CFG[c.analysis?.threatLevel]?.color || "#f59e0b", flexShrink: 0 }} />
                  {sideOpen && <span style={{ fontFamily: "monospace", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 135 }}>{c.subjectName}</span>}
                </button>
              ))}
            </div>
          )}
        </nav>
        <button onClick={() => setSideOpen(s => !s)}
          style={{ margin: "0 6px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, padding: "7px", color: "#1e293b", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>
          {sideOpen ? "◀ COLLAPSE" : "▶"}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "30px 26px" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div style={{ position: "fixed", top: -200, right: "15%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(220,38,38,0.035) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1000 }}>
          {page === "dashboard" && <Dashboard cases={cases} onNew={() => setPage("new")} onSelect={id => { setSelectedId(id); setPage("detail"); }} />}
          {page === "cases" && <CaseList cases={cases} onSelect={id => { setSelectedId(id); setPage("detail"); }} onDelete={deleteCase} onNew={() => setPage("new")} />}
          {page === "new" && <CaseWizard onComplete={addCase} onCancel={() => setPage("dashboard")} showToast={showToast} />}
          {page === "detail" && selected && <CaseDetail caseData={selected} onUpdate={updateCase} onBack={() => setPage("cases")} showToast={showToast} />}
          {page === "detail" && !selected && (
            <div style={{ textAlign: "center", padding: 60, color: "#2d3748", fontFamily: "monospace" }}>
              Case not found.
              <button onClick={() => setPage("cases")} style={{ color: "#e8a020", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", marginLeft: 8 }}>← Back</button>
            </div>
          )}
        </div>
      </div>

      {toast && <ToastEl key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #1a2332; }
        input:focus, textarea:focus { border-color: rgba(232,160,32,0.35) !important; }
        select { outline: none; }
        button { transition: opacity 0.2s; }
        button:hover:not(:disabled) { opacity: 0.82; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
