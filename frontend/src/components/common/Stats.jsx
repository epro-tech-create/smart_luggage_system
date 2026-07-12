export function Stat({ icon, label, value, note, color = 'green' }) {
  return (
    <div className="stat-box card">
      <span className={`stat-icon ${color}`}>{icon}</span>
      <div><p>{label}</p><strong>{value}</strong><small>{note}</small></div>
    </div>
  );
}
