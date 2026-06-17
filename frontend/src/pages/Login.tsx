import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Chrome, Eye, EyeOff, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import {
  loginByEmail,
  sendSmsCode,
  verifySmsCode,
  sendEmailCode,
  verifyEmailCode,
  getGoogleAuthUrl,
} from "@/api/auth";
import { trackEvent } from "@/utils/tracking";

type Tab = "email" | "email_code" | "phone";

export default function Login() {
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  const [emailForCode, setEmailForCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const emailTimerRef = useRef<ReturnType<typeof setInterval>>();

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    return () => {
      if (emailTimerRef.current) clearInterval(emailTimerRef.current);
    };
  }, []);

  const startEmailCountdown = () => {
    setEmailCountdown(60);
    emailTimerRef.current = setInterval(() => {
      setEmailCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(emailTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      const res = await loginByEmail(email, password);
      setAuth(res.access_token, res.user);
      trackEvent("login", { method: "email" });
      toast.success("登录成功");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    if (!emailForCode) return;
    setLoading(true);
    try {
      await sendEmailCode(emailForCode, "login");
      setEmailCodeSent(true);
      startEmailCountdown();
      toast.success("验证码已发送到邮箱");
    } catch (e: any) {
      toast.error(e.message || "发送验证码失败");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailCodeLogin = async () => {
    setLoading(true);
    try {
      const res = await verifyEmailCode(emailForCode, emailCode, "login");
      setAuth(res.access_token, res.user);
      trackEvent("login", { method: "email_code" });
      toast.success("登录成功");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "验证码错误或已过期");
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async () => {
    try {
      await sendSmsCode(phone, "login");
      setSmsSent(true);
      toast.success("验证码已发送");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handlePhoneLogin = async () => {
    setLoading(true);
    try {
      const res = await verifySmsCode(phone, smsCode, "login");
      setAuth(res.access_token, res.user);
      trackEvent("login", { method: "phone" });
      toast.success("登录成功");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">登录 E2M</h1>
        <p className="mb-6 text-sm text-gray-500">AI 驱动的内容转写平台</p>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            onClick={() => setTab("email")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === "email" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            <Mail size={15} /> 密码登录
          </button>
          <button
            onClick={() => setTab("email_code")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === "email_code" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            <KeyRound size={15} /> 邮箱验证码
          </button>
          <button
            onClick={() => setTab("phone")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === "phone" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            <Phone size={15} /> 手机号
          </button>
        </div>

        {/* Email + Password */}
        {tab === "email" && (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="密码"
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
            <button
              onClick={handleEmailLogin}
              disabled={loading || !email || !password}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </div>
        )}

        {/* Email verification code */}
        {tab === "email_code" && (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="邮箱地址（支持 Gmail / QQ 邮箱）"
              value={emailForCode}
              onChange={(e) => setEmailForCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="6 位验证码"
                value={emailCode}
                maxLength={6}
                onChange={(e) =>
                  setEmailCode(e.target.value.replace(/\D/g, ""))
                }
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={handleSendEmailCode}
                disabled={!emailForCode || loading || emailCountdown > 0}
                className="whitespace-nowrap rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {emailCountdown > 0
                  ? `${emailCountdown}s`
                  : emailCodeSent
                    ? "重新发送"
                    : "发送验证码"}
              </button>
            </div>
            <button
              onClick={handleEmailCodeLogin}
              disabled={loading || !emailForCode || emailCode.length !== 6}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "登录中..." : "登录"}
            </button>
            <p className="text-xs text-gray-400 text-center">
              未注册的邮箱将自动创建账户
            </p>
          </div>
        )}

        {/* Phone + SMS */}
        {tab === "phone" && (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="验证码"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={handleSendSms}
                disabled={!phone || smsSent}
                className="whitespace-nowrap rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {smsSent ? "已发送" : "发送验证码"}
              </button>
            </div>
            <button
              onClick={handlePhoneLogin}
              disabled={loading || !phone || !smsCode}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">其他方式</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <a
          href={getGoogleAuthUrl()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Chrome size={18} />
          Google 登录
        </a>

        <p className="mt-6 text-center text-sm text-gray-500">
          没有账号？{" "}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
