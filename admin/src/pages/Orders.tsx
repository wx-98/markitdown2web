import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTable";
import { getOrders } from "@/api/admin";
import type { OrderItem, Paginated } from "@/types";

export default function OrdersPage() {
  const [data, setData] = useState<Paginated<OrderItem>>({ total: 0, page: 1, size: 20, items: [] });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setData(await getOrders(page, 20));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "id", header: "ID" },
    { key: "user_email", header: "用户邮箱" },
    { key: "plan", header: "套餐" },
    {
      key: "amount_cents",
      header: "金额",
      render: (r: OrderItem) => `${r.currency} ${(r.amount_cents / 100).toFixed(2)}`,
    },
    { key: "provider", header: "支付方式" },
    {
      key: "order_status",
      header: "状态",
      render: (r: OrderItem) => (
        <span className={r.order_status === "succeeded" ? "text-green-600" : "text-amber-600"}>
          {r.order_status}
        </span>
      ),
    },
    { key: "order_time", header: "下单时间", render: (r: OrderItem) => r.order_time?.slice(0, 19).replace("T", " ") ?? "" },
    { key: "paid_time", header: "支付时间", render: (r: OrderItem) => r.paid_time?.slice(0, 19).replace("T", " ") ?? "-" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">订单管理</h1>
      <div className="mt-4">
        <DataTable
          columns={columns}
          data={data.items as any}
          page={data.page}
          total={data.total}
          size={data.size}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
