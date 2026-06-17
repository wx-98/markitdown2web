import { useState } from "react";
import { Check, CreditCard, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { createCheckout, cancelSubscription } from "@/api/payment";
import { trackEvent } from "@/utils/tracking";

const FEATURES = [
  "无限文档转换",
  "视频转笔记",
  "URL 转笔记",
  "导出 Word / PDF",
  "优先处理队列",
  "邮件支持",
];

export default function Pricing() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState("");

  const isPro = user?.subscription_plan === "monthly";

  const handleCheckout = async (provider: string) => {
    setLoading(provider);
    trackEvent("payment_init", { provider });
    try {
      const result = await createCheckout(
        provider,
        window.location.origin + "/pricing?success=1",
        window.location.origin + "/pricing?cancelled=1",
      );
      if (result.url) {
        window.location.href = result.url;
      } else if (result.code_url) {
        toast.success("请使用微信扫描二维码完成支付");
      } else {
        toast.success("支付会话已创建");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading("");
    }
  };

  const handleCancel = async () => {
    if (!confirm("确定取消订阅吗？")) return;
    try {
      await cancelSubscription();
      toast.success("订阅已取消");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">订阅套餐</h1>
      <p className="mt-1 text-sm text-gray-500">解锁全部功能，提升工作效率</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">免费版</h3>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            $0 <span className="text-sm font-normal text-gray-500">/ 月</span>
          </p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={16} className="text-green-500" />
              基础文档转换
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-400">
              <Check size={16} className="text-gray-300" />
              <span className="line-through">视频转笔记</span>
            </li>
          </ul>
          <button
            disabled
            className="mt-6 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-500"
          >
            当前套餐
          </button>
        </div>

        {/* Pro Plan */}
        <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-lg">
          <div className="absolute -top-3 right-4 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
            推荐
          </div>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">专业版</h3>
          </div>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            $9.99{" "}
            <span className="text-sm font-normal text-gray-500">/ 月</span>
          </p>
          <p className="text-sm text-gray-500">或 ¥29.00 / 月</p>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={16} className="text-green-500" />
                {f}
              </li>
            ))}
          </ul>

          {isPro ? (
            <button
              onClick={handleCancel}
              className="mt-6 w-full rounded-lg border border-red-300 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              取消订阅
            </button>
          ) : (
            <div className="mt-6 space-y-2">
              <button
                onClick={() => handleCheckout("stripe")}
                disabled={!!loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <CreditCard size={16} />
                {loading === "stripe" ? "跳转中..." : "Stripe 支付（国际卡）"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCheckout("wechat")}
                  disabled={!!loading}
                  className="flex-1 rounded-lg border border-green-600 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                >
                  {loading === "wechat" ? "生成中..." : "微信支付"}
                </button>
                <button
                  onClick={() => handleCheckout("alipay")}
                  disabled={!!loading}
                  className="flex-1 rounded-lg border border-blue-500 py-2.5 text-sm font-medium text-blue-500 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  {loading === "alipay" ? "跳转中..." : "支付宝"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
