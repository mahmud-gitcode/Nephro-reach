"use client";

import React, { useState, useEffect } from "react";
import { Bell, Building2, KeyRound, Phone, UserCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import {
  profilePatch,
  updateProfile,
} from "@/features/profile/profile.repository";
import EmergencyContactSection from "@/features/profile/EmergencyContactSection";
import { START_TOUR_EVENT } from "@/features/onboarding/MemberTour";
import { CareContactsSection } from "@/features/profile/CareContactsSection";
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
import { PageTitle } from "@/components/layout/PageTitle";

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
    /* Three nested boxes on a phone left the fields cramped (client
       review, 2026-10-08): lighter padding there, the same from sm up. */
    <Card
      as="section"
      id={id}
      tone="sunken"
      padding="small"
      className="max-sm:p-inset-xs"
    >
      <div className="mb-stack-lg flex items-center gap-inline-md px-inset-xs pt-inset-xs">
        <Icon className="h-icon-big w-icon-big text-fg-brand" />
        <h2 className="text-heading-4 text-fg">{title}</h2>
      </div>
      <Card padding="big" className="max-sm:p-inset-sm">
        {children}
      </Card>
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
  const { language } = useLanguage();
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
        label={
          language === "ES" ? "Secciones de configuración" : "Settings sections"
        }
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
  /* The account's own record (`GET /me/context`); a save goes to
     `PATCH /me/profile` and re-reads the context (Phase 4). Email and phone
     are sign-in identifiers with their own confirm flows, so they are
     shown, not edited, here. */
  const { context, refreshContext } = useAuth();
  const { language } = useLanguage();
  const account = context?.user ?? null;
  const [name, setName] = useState(account?.name ?? "");
  const save = useMutation({
    mutationFn: async () => {
      if (!account) return;
      const patch = profilePatch(
        { name: account.name, language: account.language },
        { name, language },
      );
      if (Object.keys(patch).length > 0) await updateProfile(patch);
      await refreshContext();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (save.isPending) return;
    save.mutate();
  };

  return (
    <SettingsSection
      id="profile"
      icon={UserCircle}
      title={profileData?.title || "Profile Information"}
    >
      <form onSubmit={handleSubmit}>
        {save.isSuccess ? (
          <Alert tone="success" className="mb-stack-lg" live>
            {profileData?.savedMessage || "Profile saved successfully!"}
          </Alert>
        ) : null}
        {save.isError ? (
          <Alert tone="danger" className="mb-stack-lg" live>
            {save.error instanceof Error && save.error.message
              ? save.error.message
              : language === "ES"
                ? "No se pudo guardar. Inténtelo de nuevo."
                : "That didn't save. Please try again."}
          </Alert>
        ) : null}

        <div className="space-y-stack-lg">
          <FormField label={profileData?.fullName || "Full Name"}>
            {(props) => (
              <Input
                {...props}
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
            <FormField label={profileData?.emailAddress || "Email Address"}>
              {(props) => (
                <Input
                  {...props}
                  value={account?.email ?? ""}
                  disabled
                  readOnly
                />
              )}
            </FormField>
            <FormField label={profileData?.phoneNumber || "Phone Number"}>
              {(props) => (
                <Input
                  {...props}
                  value={account?.phone ?? ""}
                  disabled
                  readOnly
                />
              )}
            </FormField>
          </div>

          {/* "Member ID" showed a made-up number; the API has no member
              number, so it is hidden until one is decided (Lead question). */}
        </div>

        <div className="mt-stack-xl flex flex-wrap items-center justify-between gap-inline-md">
          {/* The first-visit tour, again (client, 2026-10-12). */}
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
          >
            {language === "ES"
              ? "Ver el recorrido otra vez"
              : "Take the tour again"}
          </Button>
          <Button
            type="submit"
            loading={save.isPending}
            disabled={!account || name.trim() === ""}
          >
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
  const { dictionary, language } = useLanguage();
  const auth = useAuth();
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
    <div className="space-y-stack-lg">
      <PageTitle href="/dashboard/settings" />
      <div className="flex flex-col gap-inline-lg lg:flex-row lg:items-start">
        <SettingsMenu
          activeTab={activeTab}
          onTabChange={setActiveTab}
          generalHeader={st?.generalHeader || "General"}
          tabsLabels={tabsLabels}
        />
        <div className="flex-1 space-y-stack-lg">
          <TabPanel id="profile" value={activeTab}>
            <div className="space-y-stack-lg">
              {/* Remounted when the saved name changes, so the field starts
                  from the server's value rather than syncing in an effect. */}
              <ProfileInformation
                key={auth.context?.user.name ?? ""}
                profileData={st?.profile}
              />

              {/* Under the profile rather than a tab of its own: it is one more
                fact about the member, and burying it behind its own heading is
                how it stays empty until the day it is needed. */}
              <SettingsSection
                id="emergency-contact"
                icon={Phone}
                title={
                  language === "ES"
                    ? "Contacto de Emergencia"
                    : "Emergency Contact"
                }
              >
                <EmergencyContactSection />
              </SettingsSection>

              {/* The member's care offices (client, 2026-10-05). */}
              <SettingsSection
                id="care-offices"
                icon={Building2}
                title={
                  language === "ES"
                    ? "Mis Oficinas de Atención"
                    : "My Care Offices"
                }
              >
                <CareContactsSection isEs={language === "ES"} />
              </SettingsSection>
            </div>
          </TabPanel>
          <TabPanel id="notification" value={activeTab}>
            <NotificationPreferences notificationData={st?.notifications} />
          </TabPanel>
          <TabPanel id="password" value={activeTab}>
            <ChangePassword passwordData={st?.password} />
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
