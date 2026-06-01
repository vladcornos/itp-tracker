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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>🚗 ITP Tracker</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Evidență inspecții tehnice · ITP expiră după <strong>12 luni</strong></p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[["Total", vehicles.length, "#333"], ["Valide", validCount, "green"], ["Expiră în 14 zile", expiringCount, "orange"], ["Expirate", expiredCount, "red"]].map(([label, val, color]) => (
          <div key={label} style={{ background: "#f5f5f5", borderRadius: 10, padding: "1rem" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Adaugă vehicul</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
          {[["owner_name", "Proprietar", "text", "Ion Popescu"],["plate", "Nr. înmatriculare", "text", "B 123 ABC"],["phone", "Telefon", "text", "07XX XXX XXX"],["itp_date", "Data ITP", "date", ""]].map(([key, label, type, ph]) => (
            <div key={key}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
              <input type={type} placeholder={ph} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={{ width: "100%", height: 36, borderRadius: 8, border: "1px solid #ddd", padding: "0 10px", fontSize: 13 }} />
            </div>
          ))}
          <button onClick={addVehicle}
            style={{ height: 36, padding: "0 18px", background: "#222", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            + Adaugă
          </button>
        </div>
        {msg && <p style={{ marginTop: 8, fontSize: 13, color: msg.includes("Eroare") ? "red" : "green" }}>{msg}</p>}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["all", "Toate"], ["expiring", "Expiră curând"], ["expired", "Expirate"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid #ddd", background: filter === val ? "#222" : "transparent", color: filter === val ? "#fff" : "#555", fontSize: 13, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        {loading ? <p style={{ padding: "2rem", textAlign: "center", color: "#888" }}>Se încarcă...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                {["Proprietar", "Nr. înmatriculare", "Telefon", "Data ITP", "Expiră", "Zile rămase", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#aaa" }}>Nicio înregistrare.</td></tr>
              ) : filtered.map(v => {
                const days = daysLeft(v.itp_date);
                const exp = expiryDate(v.itp_date);
                const expStr = exp.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
                const [badgeColor, badgeBg, statusLabel] =
                  days < 0 ? ["#991b1b", "#fee2e2", "Expirat"] :
                  days <= 14 ? ["#92400e", "#fef3c7", "Expiră curând"] :
                  ["#065f46", "#d1fae5", "Valid"];
                return (
                  <tr key={v.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>{v.owner_name}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace" }}>{v.plate}</td>
                    <td style={{ padding: "10px 14px" }}>{v.phone}</td>
                    <td style={{ padding: "10px 14px" }}>{fmt(v.itp_date)}</td>
                    <td style={{ padding: "10px 14px" }}>{expStr}</td>
                    <td style={{ padding: "10px 14px", color: days < 0 ? "red" : days <= 14 ? "orange" : "#333", fontWeight: days <= 14 ? 600 : 400 }}>{days}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: badgeBg, color: badgeColor, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{statusLabel}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => deleteVehicle(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 16 }}>🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}