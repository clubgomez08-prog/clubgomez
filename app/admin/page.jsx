import StatsCard from "@/components/admin/StatsCard";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Rifas activas" value="0" />
        <StatsCard title="Participantes" value="0" />
        <StatsCard title="Ventas totales" value="$0" />
      </div>
    </div>
  );
}
