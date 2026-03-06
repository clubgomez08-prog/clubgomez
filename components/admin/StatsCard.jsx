export default function StatsCard({ title, value }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="text-2xl font-bold mt-2 text-white">{value}</p>
    </div>
  );
}
