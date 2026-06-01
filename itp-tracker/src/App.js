import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const today = new Date();
today.setHours(0, 0, 0, 0);

function expiryDate(itpDate) {
  const d = new Date(itpDate);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function daysLeft(itpDate) {
  const exp = expiryDate(itpDate);
  return Math.round((exp - today) / (1000 * 60 * 60 * 24));
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ owner_name: "", plate: "", phone: "", itp_date: "" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

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
    if (!error) { setMsg("Vehicul adăugat! ✅"); setForm({ owner_name: "", plate: "", phone: "", itp_date: "" }); fetchVehicles(); }
    else setMsg("Eroare: " + error.message);
  }

  async function deleteVehicle(id) {
    await supabase.from("vehicles").delete().eq("id", id);
    fetchVehicles();
  }

  const filtered = vehicles.filter(v => {
    const d = daysLeft(v.itp_date);
    if (filter === "expiring") return d >= 0 && d <= 14;
    if (filter === "expired") return d < 0;
    return true;
  });

  const expiredCount = vehicles.filter(v => daysLeft(v.itp_date) < 0).length;
  const expiringCount = vehicles.filter(v => { const d = daysLeft(v.itp_date); return d >= 0 && d <= 14; }).length;
  const validCount = vehicles.filter(v => daysLeft(v.itp_date) > 14).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.25rem", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>🚗 ITP Tracker</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>Evidență inspecții tehnice · ITP expiră după <strong>12 luni</strong></p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
        {[["Total", vehicles.length, "#333"], ["Valide", validCount, "green"], ["Expiră în 14 zile", expiringCount, "orange"], ["Expirate", expiredCount, "red"]].map(([label, val, color]) => (
          <div key={label} style={{ background: "#f5f5f5", borderRadius: 10, padding: "0.85rem 1rem" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "1rem", marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Adaugă vehicul</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["owner_name", "Proprietar", "text", "Ion Popescu"],["plate", "Nr. înmatriculare", "text", "B 123 ABC"],["phone", "Telefon", "text", "07XX XXX XXX"],["itp_date", "Data ITP", "date", ""]].map(([key, label, type, ph]) => (
            <div key={key}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
              <input type={type} placeholder={ph} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={{ width: "100%", height: 38, borderRadius: 8, border: "1px solid #ddd", padding: "0 10px", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        <button onClick={addVehicle}
          style={{ marginTop: 10, width: "100%", height: 40, background: "#222", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
          + Adaugă vehicul
        </button>
        {msg && <p style={{ marginTop: 8, fontSize: 13, color: msg.includes("Eroare") ? "red" : "green" }}>{msg}</p>}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["all", "Toate"], ["expiring", "Expiră curând"], ["expired", "Expirate"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid #ddd", background: filter === val ? "#222" : "transparent", color: filter === val ? "#fff" : "#555", fontSize: 13, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Mobile Cards */}
      <div style={{ display: "block" }} className="mobile-cards">
        {loading ? <p style={{ padding: "2rem", textAlign: "center", color: "#888" }}>Se încarcă...</p> :
          filtered.length === 0 ? <p style={{ padding: "2rem", textAlign: "center", color: "#aaa" }}>Nicio înregistrare.</p> :
          filtered.map(v => {
            const days = daysLeft(v.itp_date);
            const exp = expiryDate(v.itp_date);
            const expStr = exp.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
            const [badgeColor, badgeBg, statusLabel] =
              days < 0 ? ["#991b1b", "#fee2e2", "Expirat"] :
              days <= 14 ? ["#92400e", "#fef3c7", "Expiră curând"] :
              ["#065f46", "#d1fae5", "Valid"];
            return (
              <div key={v.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "1rem", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{v.owner_name}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 13, color: "#555", marginTop: 2 }}>{v.plate}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: badgeBg, color: badgeColor, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{statusLabel}</span>
                    <button onClick={() => deleteVehicle(v.id)} style={{ background: "#fee2e2", border: "none", cursor: "pointer", color: "#991b1b", fontSize: 16, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
                  <div><span style={{ color: "#888" }}>Telefon: </span>{v.phone}</div>
                  <div><span style={{ color: "#888" }}>Zile rămase: </span><span style={{ color: days < 0 ? "red" : days <= 14 ? "orange" : "#333", fontWeight: days <= 14 ? 600 : 400 }}>{days}</span></div>
                  <div><span style={{ color: "#888" }}>Data ITP: </span>{fmt(v.itp_date)}</div>
                  <div><span style={{ color: "#888" }}>Expiră: </span>{expStr}</div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}