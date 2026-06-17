import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { sendEmailCode, registerWithCode } from "@/api/auth";
import { trackEvent } from "@/utils/tracking";

type Step = "email" | "password";

export default function Register() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email) {
      toast.error("请输入邮箱地址");
      return;
    }
    setLoading(true);
    try {
      await sendEmailCode(email, "register");
      setCodeSent(true);
      startCountdown();
      toast.success("验证码已发送到邮箱");
    } catch (e: any) {
      toast.error(e.message || "发送验证码失败");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndNext = () => {
    if (!code || code.length !== 6) {
      toast.error("请输入 6 位验证码");
      return;
    }
    setStep("password");
  };

  const handleSubmit = async () => {
    if (password !== confirm) {
      toast.error("两次密码不一致");
      return;
    }
    if (password.length < 6) {
      toast.error("密码不能少于 6 位");
      return;
    }
    setLoading(true);
    try {
      const res = await registerWithCode(email, code, password, nickname);
      setAuth(res.access_token, res.user);
      trackEvent("register", { method: "email_code" });
      toast.success("注册成功");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">注册 E2M</h1>
        <p className="mb-6 text-sm text-gray-500">创建账号，开始使用 AI 内容转写</p>

        {/* Step indicators */}
        <div className="mb-6 flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step === "email"
                ? "bg-blue-600 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {step === "email" ? "1" : "✓"}
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step === "password"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            2
          </div>
        </div>

        {step === "email" ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="昵称（选填）"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="email"
              placeholder="邮箱地址（支持 Gmail / QQ 邮箱）"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="6 位验证码"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={handleSendCode}
                disabled={!email || loading || countdown > 0}
                className="whitespace-nowrap rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {countdown > 0
                  ? `${countdown}s`
                  : codeSent
                    ? "重新发送"
                    : "发送验证码"}
              </button>
            </div>
            <button
              onClick={handleVerifyAndNext}
              disabled={!email || !code || code.length !== 6}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              下一步
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
              邮箱：{email}（已验证）
            </div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="密码（不少于 6 位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input
              type="password"
              placeholder="确认密码"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep("email")}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !password || !confirm}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "注册中..." : "完成注册"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          已有账号？{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
