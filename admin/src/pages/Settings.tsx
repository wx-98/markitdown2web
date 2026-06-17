import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getConfig, updateConfig } from "@/api/admin";

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getConfig().then((r) => setConfig(r.config || {}));
  }, []);

  const handleChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const editable: Record<string, string> = {};
      for (const [k, v] of Object.entries(config)) {
        if (v !== "****") editable[k] = v;
      }
      await updateConfig(editable);
      toast.success("配置已保存");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const entries = Object.entries(config);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">系统配置</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "保存中..." : "保存更改"}
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        修改 .env 运行配置（敏感字段显示为 ****，不可在此编辑）
      </p>

      <div className="mt-6 space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <label className="w-72 shrink-0 text-sm font-medium text-gray-700">{key}</label>
            <input
              type="text"
              value={value}
              disabled={value === "****"}
              onChange={(e) => handleChange(key, e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-gray-400">加载中...</p>
        )}
      </div>
    </div>
  );
}
