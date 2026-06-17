import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTable";
import { getTracking } from "@/api/admin";
import type { TrackingItem, Paginated } from "@/types";

export default function TrackingPage() {
  const [data, setData] = useState<Paginated<TrackingItem>>({ total: 0, page: 1, size: 50, items: [] });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setData(await getTracking(page, 50, filter));
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "id", header: "ID" },
    { key: "event_type", header: "事件类型" },
    { key: "user_id", header: "用户 ID", render: (r: TrackingItem) => r.user_id || "-" },
    { key: "ip_address", header: "IP" },
    { key: "page_url", header: "页面 URL", render: (r: TrackingItem) => (
      <span className="block max-w-[200px] truncate" title={r.page_url}>{r.page_url}</span>
    )},
    {
      key: "event_data",
      header: "数据",
      render: (r: TrackingItem) => (
        <span className="block max-w-[200px] truncate text-xs text-gray-500" title={JSON.stringify(r.event_data)}>
          {JSON.stringify(r.event_data)}
        </span>
      ),
    },
    { key: "created_at", header: "时间", render: (r: TrackingItem) => r.created_at?.slice(0, 19).replace("T", " ") ?? "" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">埋点数据</h1>
      <div className="mt-4 mb-4">
        <input
          type="text"
          placeholder="按事件类型筛选..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <DataTable
        columns={columns}
        data={data.items as any}
        page={data.page}
        total={data.total}
        size={data.size}
        onPageChange={setPage}
      />
    </div>
  );
}
