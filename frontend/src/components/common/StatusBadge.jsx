export function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}
