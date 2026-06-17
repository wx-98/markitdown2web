import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable";
import { getUsers, toggleBlock } from "@/api/admin";
import type { UserInfo, Paginated } from "@/types";

export default function UsersPage() {
  const [data, setData] = useState<Paginated<UserInfo>>({ total: 0, page: 1, size: 20, items: [] });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const res = await getUsers(page, 20, search);
    setData(res);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleBlock = async (id: string, block: boolean) => {
    await toggleBlock(id, block);
    toast.success(block ? "已拉黑" : "已解封");
    load();
  };

  const columns = [
    { key: "email", header: "邮箱" },
    { key: "nickname", header: "昵称" },
    { key: "auth_provider", header: "注册方式" },
    { key: "subscription_plan", header: "套餐" },
    {
      key: "is_blocked",
      header: "状态",
      render: (r: UserInfo) => (
        <span className={r.is_blocked ? "text-red-600" : "text-green-600"}>
          {r.is_blocked ? "已拉黑" : "正常"}
        </span>
      ),
    },
    { key: "created_at", header: "注册时间", render: (r: UserInfo) => r.created_at?.slice(0, 10) ?? "" },
    {
      key: "actions",
      header: "操作",
      render: (r: UserInfo) =>
        r.role !== "admin" && (
          <button
            onClick={() => handleBlock(r.id, !r.is_blocked)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              r.is_blocked
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {r.is_blocked ? "解封" : "拉黑"}
          </button>
        ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">用户管理</h1>
      <div className="mt-4 mb-4">
        <input
          type="text"
          placeholder="搜索邮箱或昵称..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
