"use client";

import React from "react";
import { Bell, KeyRound, UserCircle } from "lucide-react";

type SettingsTab = "profile" | "notification" | "password";
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const settingsMenu = [
  { id: "profile", label: "Profile", href: "#profile", icon: UserCircle },
  { id: "notification", label: "Notification", href: "#notification", icon: Bell },
  { id: "password", label: "Change Password", href: "#password", icon: KeyRound },
] satisfies Array<{
  id: SettingsTab;
  label: string;
  href: string;
  icon: IconType;
}>;

const notifications = [
  {
    title: "Weekly Check-In Reminders",
    description: "Get reminded to complete your weekly check-in",
  },
  {
    title: "Live Class Reminders",
    description: "Notifications about upcoming live classes",
  },
  {
    title: "Journal Reminders",
    description: "Daily reminder to log your journal entries",
  },
  {
    title: "New Education Content",
    description: "Alerts when new videos or articles are available",
  },
  {
    title: "Community Activity",
    description: "Notifications for replies and mentions in community",
  },
];

const passwordFields = [
  { label: "Current Password", placeholder: "Enter current password" },
  { label: "New Password", placeholder: "Create a new secure password" },
  { label: "Confirm Password", placeholder: "Re-enter new password to confirm" },
];

function getHashTab(hash: string): SettingsTab {
  if (hash === "#notification") return "notification";
  if (hash === "#password") return "password";
  return "profile";
}

function SettingsMenu({
  activeTab,
  onTabChange,
}: {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}) {
  return (
    <aside className="w-full rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:w-[289px]">
      <p className="mb-2 px-4 text-xs font-medium text-slate-500">General</p>
      <div className="space-y-2" role="tablist" aria-label="Settings sections">
        {settingsMenu.map((item) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            id={`${item.id}-tab`}
            aria-selected={activeTab === item.id}
            aria-controls={`${item.id}-panel`}
            onClick={() => {
              onTabChange(item.id);
              window.history.replaceState(null, "", item.href);
            }}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${
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
  disabled,
}: {
  label: string;
  value: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium leading-6 text-slate-900">{label}</span>
      <input
        defaultValue={value}
        disabled={disabled}
        className={`h-12 w-full rounded border border-[#CBD5ED] px-4 text-base text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          disabled ? "bg-[#F1F5FA]" : "bg-white"
        }`}
      />
    </label>
  );
}

function ProfileInformation() {
  return (
    <section
      id="profile"
      className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] px-3 py-4 shadow-sm"
    >
      <div className="mb-[18px] flex items-center gap-2.5">
        <UserCircle className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-medium leading-[30px] text-black">Profile Information</h1>
      </div>

      <form className="rounded-lg bg-white p-3">
        <div className="space-y-3.5">
          <Field label="Full Name" value="Example" />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <Field label="Email Address" value="Example@email.com" disabled />
            <Field label="Phone Number" value="Example123" />
          </div>
          <Field label="Member ID" value="MM-XK877" disabled />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            Save Profile Changes
          </button>
        </div>
      </form>
    </section>
  );
}

function Toggle({ checked = true }: { checked?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-8 shrink-0 items-center rounded-full p-0.5 ${
        checked ? "justify-end bg-blue-600" : "justify-start bg-slate-300"
      }`}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
    </span>
  );
}

function NotificationPreferences() {
  return (
    <section
      id="notification"
      className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] px-3 py-4 shadow-sm"
    >
      <div className="mb-[18px] flex items-center gap-2.5">
        <Bell className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-medium leading-[30px] text-black">Notification Settings</h2>
      </div>

      <div className="rounded-lg bg-white p-3">
        <div className="space-y-3.5">
          {notifications.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-xl border-b border-dashed border-[#E9EEF4] bg-[#F1F5FA] p-3"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-medium leading-7 text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-5 text-slate-500">
                  {item.description}
                </p>
              </div>
              <Toggle />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            Save Notification Settings
          </button>
        </div>
      </div>
    </section>
  );
}

function PasswordField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium leading-6 text-slate-900">{label}</span>
      <input
        type="password"
        placeholder={placeholder}
        className="h-12 w-full rounded border border-[#CBD5ED] bg-white px-4 text-base text-slate-600 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function ChangePassword() {
  return (
    <section
      id="password"
      className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] px-3 py-4 shadow-sm"
    >
      <div className="mb-[18px] flex items-center gap-2.5">
        <KeyRound className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-medium leading-[30px] text-black">Change Your Password</h2>
      </div>

      <form className="rounded-lg bg-white p-3">
        <div className="space-y-3.5">
          {passwordFields.map((field) => (
            <PasswordField key={field.label} {...field} />
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            Update Password
          </button>
        </div>
      </form>
    </section>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");

  React.useEffect(() => {
    const syncTabFromHash = () => {
      setActiveTab(getHashTab(window.location.hash));
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    return () => {
      window.removeEventListener("hashchange", syncTabFromHash);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <SettingsMenu activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 space-y-4">
        {activeTab === "profile" && (
          <div id="profile-panel" role="tabpanel" aria-labelledby="profile-tab">
            <ProfileInformation />
          </div>
        )}
        {activeTab === "notification" && (
          <div id="notification-panel" role="tabpanel" aria-labelledby="notification-tab">
            <NotificationPreferences />
          </div>
        )}
        {activeTab === "password" && (
          <div id="password-panel" role="tabpanel" aria-labelledby="password-tab">
            <ChangePassword />
          </div>
        )}
      </div>
    </div>
  );
}
