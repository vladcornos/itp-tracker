import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const today = new Date();
today.setHours(0, 0, 0, 0);

function expiryDate(itpDate, months) {
  const d = new Date(itpDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysLeft(itpDate, months) {
  const exp = expiryDate(itpDate, months);
  return Math.round((exp - today) / (1000 * 60 * 60 * 24));
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const DURATION_OPTIONS = [
  { value: 6, label: "6 luni", desc: "Vehicule peste 12 ani", icon: "🕓" },
  { value: 12, label: "1 an", desc: "Vehicule standard", icon: "📅" },
  { value: 24, label: "2 ani", desc: "Vehicule noi (primul ITP)", icon: "🆕" },
];

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ owner_name: "", plate: "", phone: "", itp_date: "", duration_months: 12 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchVehicles(); }, []);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase.from("vehicles").select("*").order("itp_date");
    if (!error) setVehicles(data);
    setLoading(false);
  }

  async function addVehicle() {
    if (!form.owner_name || !form.plate || !form.phone || !form.itp_date) {
      setMsg("Completați toate câmpurile!"); return;
    }
    const { error } = await supabase.from("vehicles").insert([form]);
    if (!error) {
      setMsg("Vehicul adăugat! ✅");
      setForm({ owner_name: "", plate: "", phone: "", itp_date: "", duration_months: 12 });
      setShowForm(false);
      fetchVehicles();
      setTimeout(() => setMsg(""), 3000);
    } else setMsg("Eroare: " + error.message);
  }

 async function deleteVehicle(id) {
    if (!window.confirm("Ești sigur că vrei să ștergi acest vehicul?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", Number(id));
    if (error) { alert("Eroare: " + error.message); return; }
    fetchVehicles();
  }

  const filtered = vehicles.filter(v => {
    const months = v.duration_months || 12;
    const d = daysLeft(v.itp_date, months);
    if (filter === "expiring") return d >= 0 && d <= 14;
    if (filter === "expired") return d < 0;
    return true;
  });

  const expiredCount = vehicles.filter(v => daysLeft(v.itp_date, v.duration_months || 12) < 0).length;
  const expiringCount = vehicles.filter(v => { const d = daysLeft(v.itp_date, v.duration_months || 12); return d >= 0 && d <= 14; }).length;
  const validCount = vehicles.filter(v => daysLeft(v.itp_date, v.duration_months || 12) > 14).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "1rem 1.25rem", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28, animation: "drive 3s linear infinite" }}>🚗</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>ITP Tracker</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Notificări automate · 14 zile înainte de expirare</div>
            </div>
          </div>
          <button onClick={() => { setShowForm(!showForm); setMsg(""); }}
            style={{ background: showForm ? "rgba(255,255,255,0.1)" : "#e63946", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {showForm ? "✕ Închide" : "+ Adaugă vehicul"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes drive { 0% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 100% { transform: translateX(-4px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .card:hover { transform: translateY(-2px); }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(255,255,255,0.5) !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.25rem" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            ["🚘", "Total vehicule", vehicles.length, "#fff", "rgba(255,255,255,0.1)"],
            ["✅", "ITP valid", validCount, "#4ade80", "rgba(74,222,128,0.1)"],
            ["⚠️", "Expiră în 14 zile", expiringCount, "#fbbf24", "rgba(251,191,36,0.1)"],
            ["🚨", "Expirate", expiredCount, "#f87171", "rgba(248,113,113,0.1)"],
          ].map(([icon, label, val, color, bg]) => (
            <div key={label} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 14, padding: "1rem" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }}>{label}</div>
              <div style={{ color, fontSize: 28, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "1.25rem", marginBottom: 20, animation: "fadeIn 0.3s ease" }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 15, marginBottom: 14 }}>📋 Înregistrare vehicul nou</div>

            {/* Basic fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["owner_name", "👤 Proprietar", "text", "Ion Popescu"], ["plate", "🔢 Nr. înmatriculare", "text", "B 123 ABC"], ["phone", "📱 Telefon", "text", "07XX XXX XXX"], ["itp_date", "📅 Data ITP efectuat", "date", ""]].map(([key, label, type, ph]) => (
                <div key={key}>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 5 }}>{label}</div>
                  <input type={type} placeholder={ph} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", padding: "0 12px", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
              ))}
            </div>

            {/* Duration selector */}
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>⏱ Valabilitate ITP</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setForm({ ...form, duration_months: opt.value })}
                  style={{
                    padding: "10px 8px", borderRadius: 10, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                    border: form.duration_months === opt.value ? "2px solid #e63946" : "1px solid rgba(255,255,255,0.2)",
                    background: form.duration_months === opt.value ? "rgba(230,57,70,0.2)" : "rgba(255,255,255,0.05)",
                    color: "#fff"
                  }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{opt.label}</div>
      
                </button>
              ))}
            </div>

            <button onClick={addVehicle}
              style={{ width: "100%", height: 44, background: "#e63946", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              ✅ Salvează vehicul
            </button>
            {msg && <p style={{ marginTop: 8, fontSize: 13, color: msg.includes("Eroare") ? "#f87171" : "#4ade80", textAlign: "center" }}>{msg}</p>}
          </div>
        )}

        {msg && !showForm && <p style={{ marginBottom: 12, fontSize: 13, color: "#4ade80", textAlign: "center" }}>{msg}</p>}

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {[["all", "🚘 Toate", vehicles.length], ["expiring", "⚠️ Expiră curând", expiringCount], ["expired", "🚨 Expirate", expiredCount]].map(([val, label, count]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${filter === val ? "#e63946" : "rgba(255,255,255,0.2)"}`, background: filter === val ? "#e63946" : "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: filter === val ? 600 : 400 }}>
              {label} <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 4 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Vehicle Cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.5)" }}>⏳ Se încarcă...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🚗</div>
            <div>Nicio înregistrare găsită.</div>
          </div>
        ) : filtered.map(v => {
          const months = v.duration_months || 12;
          const days = daysLeft(v.itp_date, months);
          const exp = expiryDate(v.itp_date, months);
          const expStr = exp.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
          const [color, bg, statusLabel, icon] =
            days < 0 ? ["#f87171", "rgba(248,113,113,0.1)", "Expirat", "🚨"] :
            days <= 14 ? ["#fbbf24", "rgba(251,191,36,0.1)", "Expiră curând", "⚠️"] :
            ["#4ade80", "rgba(74,222,128,0.1)", "Valid", "✅"];

          const percent = Math.max(0, Math.min(100, Math.round((days / months / 30) * 100)));
          const durationLabel = DURATION_OPTIONS.find(o => o.value === months)?.label || `${months} luni`;

          return (
            <div key={v.id} className="card" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "1.1rem", marginBottom: 12, transition: "transform 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{v.owner_name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 13 }}>{v.plate}</span>
                    <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>⏱ {durationLabel}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: bg, color, border: `1px solid ${color}40`, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{icon} {statusLabel}</span>
                  <button onClick={() => deleteVehicle(v.id)}
                    style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer", color: "#f87171", fontSize: 15, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, height: 6, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: 10, transition: "width 0.5s ease" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
                <div style={{ color: "rgba(255,255,255,0.5)" }}>📱 {v.phone}</div>
                <div style={{ color: "rgba(255,255,255,0.5)" }}>⏳ <span style={{ color, fontWeight: 600 }}>{days} zile rămase</span></div>
                <div style={{ color: "rgba(255,255,255,0.5)" }}>📅 ITP: {fmt(v.itp_date)}</div>
                <div style={{ color: "rgba(255,255,255,0.5)" }}>🗓 Expiră: {expStr}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}