"use client";

import React, { useState, useEffect } from "react";
import { Bell, KeyRound, UserCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  SwitchRow,
  TabPanel,
  Tabs,
} from "@/components/ui";

type SettingsTab = "profile" | "notification" | "password";
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const defaultNotifications = [
  {
    id: "medicationReminders",
    title: "Medication Reminders",
    description:
      "Daily notifications and alerts for scheduled medication times",
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

/** The panel shell each settings section shares. */
function SettingsSection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: IconType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card as="section" id={id} tone="sunken" padding="small">
      <div className="mb-stack-lg flex items-center gap-inline-md px-inset-xs pt-inset-xs">
        <Icon className="h-icon-big w-icon-big text-fg-brand" />
        <h2 className="text-heading-4 text-fg">{title}</h2>
      </div>
      <Card padding="big">{children}</Card>
    </Card>
  );
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
  tabsLabels: { profile: string; notification: string; password: string };
}) {
  const items = [
    { id: "profile" as const, label: tabsLabels.profile, icon: <UserCircle /> },
    {
      id: "notification" as const,
      label: tabsLabels.notification,
      icon: <Bell />,
    },
    { id: "password" as const, label: tabsLabels.password, icon: <KeyRound /> },
  ];

  return (
    <Card as="section" className="w-full lg:sticky lg:top-24 lg:w-[289px]">
      <p className="mb-stack-sm px-inset-sm text-overline text-fg-muted">
        {generalHeader}
      </p>
      <Tabs
        variant="vertical"
        label="Settings sections"
        items={items}
        value={activeTab}
        onChange={(id) => {
          onTabChange(id);
          window.history.replaceState(null, "", `#${id}`);
        }}
      />
    </Card>
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
    <SettingsSection
      id="profile"
      icon={UserCircle}
      title={profileData?.title || "Profile Information"}
    >
      <form onSubmit={handleSubmit}>
        {saved ? (
          <Alert tone="success" className="mb-stack-lg">
            {profileData?.savedMessage || "Profile saved successfully!"}
          </Alert>
        ) : null}

        <div className="space-y-stack-lg">
          <FormField label={profileData?.fullName || "Full Name"}>
            {(props) => (
              <Input
                {...props}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
            <FormField label={profileData?.emailAddress || "Email Address"}>
              {(props) => (
                <Input
                  {...props}
                  value={user?.email || "sarah.jenkins@example.com"}
                  disabled
                  readOnly
                />
              )}
            </FormField>
            <FormField label={profileData?.phoneNumber || "Phone Number"}>
              {(props) => (
                <Input
                  {...props}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
            </FormField>
          </div>

          <FormField label={profileData?.memberId || "Member ID"}>
            {(props) => <Input {...props} value="MM-XK877" disabled readOnly />}
          </FormField>
        </div>

        <div className="mt-stack-xl flex justify-end">
          <Button type="submit">
            {profileData?.saveButton || "Save Profile Changes"}
          </Button>
        </div>
      </form>
    </SettingsSection>
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
    <SettingsSection
      id="notification"
      icon={Bell}
      title={notificationData?.title || "Notification Settings"}
    >
      {saved ? (
        <Alert tone="success" className="mb-stack-lg">
          {notificationData?.savedMessage || "Preferences saved successfully!"}
        </Alert>
      ) : null}

      <div className="space-y-stack-md">
        {items.map((item) => (
          <SwitchRow
            key={item.id}
            title={item.title}
            description={item.description}
            checked={toggles[item.id] ?? true}
            onChange={() => toggleItem(item.id)}
          />
        ))}
      </div>

      <div className="mt-stack-xl flex justify-end">
        <Button onClick={handleSave}>
          {notificationData?.saveButton || "Save Notification Settings"}
        </Button>
      </div>
    </SettingsSection>
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
    <SettingsSection
      id="password"
      icon={KeyRound}
      title={passwordData?.title || "Change Your Password"}
    >
      <form onSubmit={handleSubmit}>
        {saved ? (
          <Alert tone="success" className="mb-stack-lg">
            {passwordData?.updatedMessage || "Password updated successfully!"}
          </Alert>
        ) : null}

        <div className="space-y-stack-lg">
          <FormField
            label={passwordData?.currentPassword || "Current Password"}
            required
          >
            {(props) => (
              <Input
                {...props}
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder={
                  passwordData?.currentPlaceholder || "Enter current password"
                }
              />
            )}
          </FormField>

          <FormField
            label={passwordData?.newPassword || "New Password"}
            required
          >
            {(props) => (
              <Input
                {...props}
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder={
                  passwordData?.newPlaceholder || "Create a new secure password"
                }
              />
            )}
          </FormField>

          {/* The mismatch error belongs to the field that has to change. */}
          <FormField
            label={passwordData?.confirmPassword || "Confirm Password"}
            error={error || undefined}
            required
          >
            {(props) => (
              <Input
                {...props}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={
                  passwordData?.confirmPlaceholder ||
                  "Re-enter new password to confirm"
                }
              />
            )}
          </FormField>
        </div>

        <div className="mt-stack-xl flex justify-end">
          <Button type="submit">
            {passwordData?.updateButton || "Update Password"}
          </Button>
        </div>
      </form>
    </SettingsSection>
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
    <div className="flex flex-col gap-inline-lg lg:flex-row lg:items-start">
      <SettingsMenu
        activeTab={activeTab}
        onTabChange={setActiveTab}
        generalHeader={st?.generalHeader || "General"}
        tabsLabels={tabsLabels}
      />
      <div className="flex-1 space-y-stack-lg">
        <TabPanel id="profile" value={activeTab}>
          <ProfileInformation profileData={st?.profile} />
        </TabPanel>
        <TabPanel id="notification" value={activeTab}>
          <NotificationPreferences notificationData={st?.notifications} />
        </TabPanel>
        <TabPanel id="password" value={activeTab}>
          <ChangePassword passwordData={st?.password} />
        </TabPanel>
      </div>
    </div>
  );
}
