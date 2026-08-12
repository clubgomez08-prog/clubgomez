export default function StatsCard({ title, value }) {
  return (
    <div className="admin-stat">
      <p className="admin-stat__title">{title}</p>
      <p className="admin-stat__value">{value}</p>
    </div>
  );
}
