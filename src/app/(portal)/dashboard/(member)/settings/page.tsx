"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2, KeyRound, UserCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

type SettingsTab = "profile" | "notification" | "password";
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const defaultNotifications = [
  {
    id: "medicationReminders",
    title: "Medication Reminders",
    description: "Daily notifications and alerts for scheduled medication times",
  },
  {
    id: "weeklyCheckIn",
    title: "Weekly Check-In Reminders",
    description: "Get reminded to complete your weekly check-in",
  },
  {
    id: "liveClass",
    title: "Live Class Reminders",
    description: "Notifications about upcoming live classes",
  },
  {
    id: "journal",
    title: "Journal Reminders",
    description: "Daily reminder to log your journal entries",
  },
  {
    id: "education",
    title: "New Education Content",
    description: "Alerts when new videos or articles are available",
  },
  {
    id: "community",
    title: "Community Activity",
    description: "Notifications for replies and mentions in community",
  },
];

function getHashTab(hash: string): SettingsTab {
  if (hash === "#notification") return "notification";
  if (hash === "#password") return "password";
  return "profile";
}

function SettingsMenu({
  activeTab,
  onTabChange,
  generalHeader,
  tabsLabels,
}: {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  generalHeader: string;
  tabsLabels: {
    profile: string;
    notification: string;
    password: string;
  };
}) {
  const menuItems: Array<{
    id: SettingsTab;
    label: string;
    href: string;
    icon: IconType;
  }> = [
    { id: "profile", label: tabsLabels.profile, href: "#profile", icon: UserCircle },
    { id: "notification", label: tabsLabels.notification, href: "#notification", icon: Bell },
    { id: "password", label: tabsLabels.password, href: "#password", icon: KeyRound },
  ];

  return (
    <aside className="w-full rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:w-[289px]">
      <p className="mb-2 px-4 text-xs font-medium text-slate-500">{generalHeader}</p>
      <div className="space-y-2" role="tablist" aria-label="Settings sections">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${item.id}-tab`}
            aria-selected={activeTab === item.id}
            aria-controls={`${item.id}-panel`}
            onClick={() => {
              onTabChange(item.id);
              window.history.replaceState(null, "", item.href);
            }}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium leading-6 text-slate-900">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`h-12 w-full rounded border border-[#CBD5ED] px-4 text-base text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          disabled ? "bg-[#F1F5FA] cursor-not-allowed" : "bg-white"
        }`}
      />
    </label>
  );
}

function ProfileInformation({
  profileData,
}: {
  profileData?: {
    title: string;
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    memberId: string;
    saveButton: string;
    savedMessage: string;
  };
}) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "Sarah Jenkins");
  const [phone, setPhone] = useState("555-019-2834");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section
      id="profile"
      className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] px-3 py-4 shadow-sm"
    >
      <div className="mb-[18px] flex items-center gap-2.5">
        <UserCircle className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-medium leading-[30px] text-black">
          {profileData?.title || "Profile Information"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-4">
        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{profileData?.savedMessage || "Profile saved successfully!"}</span>
          </div>
        )}

        <div className="space-y-3.5">
          <Field
            label={profileData?.fullName || "Full Name"}
            value={name}
            onChange={setName}
          />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <Field
              label={profileData?.emailAddress || "Email Address"}
              value={user?.email || "sarah.jenkins@example.com"}
              disabled
            />
            <Field
              label={profileData?.phoneNumber || "Phone Number"}
              value={phone}
              onChange={setPhone}
            />
          </div>
          <Field
            label={profileData?.memberId || "Member ID"}
            value="MM-XK877"
            disabled
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="flex h-12 items-center justify-center rounded bg-blue-600 px-5 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {profileData?.saveButton || "Save Profile Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-8 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? "justify-end bg-blue-600" : "justify-start bg-slate-300"
      }`}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
    </span>
  );
}

function NotificationPreferences({
  notificationData,
}: {
  notificationData?: {
    title: string;
    saveButton: string;
    savedMessage: string;
    items: Array<{ id: string; title: string; description: string }>;
  };
}) {
  const items =
    notificationData?.items && notificationData.items.length > 0
      ? notificationData.items
      : defaultNotifications;

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    weeklyCheckIn: true,
    liveClass: true,
    journal: true,
    education: false,
    community: true,
  });
  const [saved, setSaved] = useState(false);

  const toggleItem = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section
      id="notification"
      className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] px-3 py-4 shadow-sm"
    >
      <div className="mb-[18px] flex items-center gap-2.5">
        <Bell className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-medium leading-[30px] text-black">
          {notificationData?.title || "Notification Settings"}
        </h2>
      </div>

      <div className="rounded-lg bg-white p-4">
        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{notificationData?.savedMessage || "Preferences saved successfully!"}</span>
          </div>
        )}

        <div className="space-y-3.5">
          {items.map((item) => {
            const isChecked = toggles[item.id] ?? true;
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between gap-3 rounded-xl border-b border-dashed border-[#E9EEF4] bg-[#F1F5FA] p-3 cursor-pointer select-none transition-colors hover:bg-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium leading-7 text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>
                <Toggle checked={isChecked} />
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 items-center justify-center rounded bg-blue-600 px-5 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {notificationData?.saveButton || "Save Notification Settings"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ChangePassword({
  passwordData,
}: {
  passwordData?: {
    title: string;
    currentPassword: string;
    currentPlaceholder: string;
    newPassword: string;
    newPlaceholder: string;
    confirmPassword: string;
    confirmPlaceholder: string;
    updateButton: string;
    updatedMessage: string;
  };
}) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setSaved(true);
    setCurrent("");
    setNewPass("");
    setConfirm("");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section
      id="password"
      className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] px-3 py-4 shadow-sm"
    >
      <div className="mb-[18px] flex items-center gap-2.5">
        <KeyRound className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-medium leading-[30px] text-black">
          {passwordData?.title || "Change Your Password"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-4">
        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{passwordData?.updatedMessage || "Password updated successfully!"}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-2 block text-base font-medium leading-6 text-slate-900">
              {passwordData?.currentPassword || "Current Password"}
            </span>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder={passwordData?.currentPlaceholder || "Enter current password"}
              required
              className="h-12 w-full rounded border border-[#CBD5ED] bg-white px-4 text-base text-slate-600 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-base font-medium leading-6 text-slate-900">
              {passwordData?.newPassword || "New Password"}
            </span>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder={passwordData?.newPlaceholder || "Create a new secure password"}
              required
              className="h-12 w-full rounded border border-[#CBD5ED] bg-white px-4 text-base text-slate-600 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-base font-medium leading-6 text-slate-900">
              {passwordData?.confirmPassword || "Confirm Password"}
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={passwordData?.confirmPlaceholder || "Re-enter new password to confirm"}
              required
              className="h-12 w-full rounded border border-[#CBD5ED] bg-white px-4 text-base text-slate-600 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="flex h-12 items-center justify-center rounded bg-blue-600 px-5 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {passwordData?.updateButton || "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function SettingsPage() {
  const { dictionary } = useLanguage();
  const st = dictionary?.settings;

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  useEffect(() => {
    const syncTabFromHash = () => {
      setActiveTab(getHashTab(window.location.hash));
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    return () => {
      window.removeEventListener("hashchange", syncTabFromHash);
    };
  }, []);

  const tabsLabels = {
    profile: st?.tabs?.profile || "Profile",
    notification: st?.tabs?.notification || "Notification",
    password: st?.tabs?.password || "Change Password",
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <SettingsMenu
        activeTab={activeTab}
        onTabChange={setActiveTab}
        generalHeader={st?.generalHeader || "General"}
        tabsLabels={tabsLabels}
      />
      <div className="flex-1 space-y-4">
        {activeTab === "profile" && (
          <div id="profile-panel" role="tabpanel" aria-labelledby="profile-tab">
            <ProfileInformation profileData={st?.profile} />
          </div>
        )}
        {activeTab === "notification" && (
          <div id="notification-panel" role="tabpanel" aria-labelledby="notification-tab">
            <NotificationPreferences notificationData={st?.notifications} />
          </div>
        )}
        {activeTab === "password" && (
          <div id="password-panel" role="tabpanel" aria-labelledby="password-tab">
            <ChangePassword passwordData={st?.password} />
          </div>
        )}
      </div>
    </div>
  );
}
