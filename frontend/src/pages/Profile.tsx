import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  CreditCard,
  Crown,
  KeyRound,
  Mail,
  Moon,
  Monitor,
  Palette,
  Save,
  Shield,
  Sun,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import {
  updateProfile,
  changePassword,
  changeEmail,
  sendEmailCode,
  getMe,
} from "@/api/auth";
import type { UserInfo } from "@/types";

type Section = "profile" | "security" | "appearance";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const { theme, setTheme } = useThemeStore();

  const [section, setSection] = useState<Section>("profile");
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [saving, setSaving] = useState(false);

  // Change password
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const refreshUser = async () => {
    try {
      const me: UserInfo = await getMe();
      if (token) setAuth(token, me);
    } catch { /* ignore */ }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ nickname });
      await refreshUser();
      toast.success("个人信息已更新");
    } catch (e: any) {
      toast.error(e.message || "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) { toast.error("两次密码不一致"); return; }
    if (newPwd.length < 6) { toast.error("新密码不能少于 6 位"); return; }
    setPwdLoading(true);
    try {
      await changePassword(curPwd, newPwd);
      toast.success("密码修改成功");
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e: any) {
      toast.error(e.message || "密码修改失败");
    } finally {
      setPwdLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) { clearInterval(timerRef.current); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const handleSendEmailCode = async () => {
    if (!newEmail) return;
    setEmailLoading(true);
    try {
      await sendEmailCode(newEmail, "change_email");
      setCodeSent(true);
      startCountdown();
      toast.success("验证码已发送到新邮箱");
    } catch (e: any) {
      toast.error(e.message || "发送失败");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (emailCode.length !== 6) { toast.error("请输入 6 位验证码"); return; }
    setEmailLoading(true);
    try {
      await changeEmail(newEmail, emailCode);
      await refreshUser();
      toast.success("邮箱更换成功");
      setNewEmail(""); setEmailCode(""); setCodeSent(false);
    } catch (e: any) {
      toast.error(e.message || "更换邮箱失败");
    } finally {
      setEmailLoading(false);
    }
  };

  const sections: { id: Section; label: string; icon: typeof UserIcon }[] = [
    { id: "profile", label: "个人信息", icon: UserIcon },
    { id: "security", label: "账号安全", icon: Shield },
    { id: "appearance", label: "外观设置", icon: Palette },
  ];

  const themeOptions: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "浅色", icon: Sun },
    { value: "dark", label: "深色", icon: Moon },
    { value: "system", label: "跟随系统", icon: Monitor },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">个人中心</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">管理你的账号信息和偏好设置</p>

      <div className="mt-6 flex gap-6">
        {/* Left nav */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                section === id
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="min-w-0 flex-1">
          {/* ===== Profile ===== */}
          {section === "profile" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">基本信息</h2>

                {/* Avatar */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                        {(user?.nickname || user?.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <button className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-md dark:bg-gray-700">
                      <Camera size={12} className="text-gray-500" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user?.nickname}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">昵称</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">登录方式</label>
                    <input
                      type="text"
                      value={user?.auth_provider === "google" ? "Google" : user?.auth_provider === "phone" ? "手机号" : "邮箱密码"}
                      disabled
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving || nickname === user?.nickname}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save size={15} />
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>

              {/* Subscription info */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <Crown size={18} className="text-amber-500" />
                  订阅信息
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.subscription_plan === "monthly" ? "专业版" : "免费版"}
                    </p>
                    {user?.subscription_expires_at && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        到期时间：{new Date(user.subscription_expires_at).toLocaleDateString("zh-CN")}
                      </p>
                    )}
                  </div>
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20"
                  >
                    <CreditCard size={14} />
                    {user?.subscription_plan === "monthly" ? "管理订阅" : "升级套餐"}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ===== Security ===== */}
          {section === "security" && (
            <div className="space-y-6">
              {/* Change password */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <KeyRound size={18} />
                  修改密码
                </h2>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="当前密码"
                    value={curPwd}
                    onChange={(e) => setCurPwd(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="password"
                    placeholder="新密码（不少于 6 位）"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="password"
                    placeholder="确认新密码"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={pwdLoading || !curPwd || !newPwd || !confirmPwd}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Check size={15} />
                    {pwdLoading ? "修改中..." : "确认修改"}
                  </button>
                </div>
              </div>

              {/* Change email */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <Mail size={18} />
                  更换邮箱
                </h2>
                <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                  当前邮箱：{user?.email || "未绑定"}
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="新邮箱地址"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="6 位验证码"
                      maxLength={6}
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={handleSendEmailCode}
                      disabled={!newEmail || emailLoading || countdown > 0}
                      className="whitespace-nowrap rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors dark:hover:bg-blue-900/20"
                    >
                      {countdown > 0 ? `${countdown}s` : codeSent ? "重新发送" : "发送验证码"}
                    </button>
                  </div>
                  <button
                    onClick={handleChangeEmail}
                    disabled={emailLoading || !newEmail || emailCode.length !== 6}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Check size={15} />
                    {emailLoading ? "更换中..." : "确认更换"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== Appearance ===== */}
          {section === "appearance" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Palette size={18} />
                主题设置
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                选择你偏好的显示模式
              </p>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      theme === value
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                    }`}
                  >
                    <Icon size={24} className={theme === value ? "text-blue-600" : "text-gray-500 dark:text-gray-400"} />
                    <span className={`text-sm font-medium ${theme === value ? "text-blue-600" : "text-gray-700 dark:text-gray-300"}`}>
                      {label}
                    </span>
                    {theme === value && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
