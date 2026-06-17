import { useEffect, useState } from "react";
import { Users, DollarSign, CreditCard, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "@/components/StatsCard";
import { getDashboard, getRevenue } from "@/api/admin";
import type { DashboardData } from "@/types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [chart, setChart] = useState<{ date: string; total_cents: number }[]>([]);

  useEffect(() => {
    getDashboard().then(setStats);
    getRevenue(30).then((r) => setChart(r.data));
  }, []);

  if (!stats) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">仪表盘</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="总用户数" value={stats.total_users} icon={Users} />
        <StatsCard
          title="30 天新用户"
          value={stats.new_users_30d}
          icon={Users}
          color="text-green-600"
        />
        <StatsCard
          title="活跃订阅"
          value={stats.active_subscriptions}
          icon={CreditCard}
          color="text-amber-600"
        />
        <StatsCard
          title="30 天收入"
          value={`$${(stats.revenue_30d_cents / 100).toFixed(2)}`}
          icon={DollarSign}
          color="text-emerald-600"
        />
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-800">收入趋势（近 30 天）</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 100).toFixed(0)}`} />
            <Tooltip formatter={(v: number) => `$${(v / 100).toFixed(2)}`} />
            <Line type="monotone" dataKey="total_cents" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
