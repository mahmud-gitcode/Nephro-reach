"use client";

import React, { useMemo, useState } from "react";
import { Bell, Eye, Radar, Search, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from "@/components/ui";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const summaryCards: Array<{
  title: string;
  value: string;
  icon: IconType;
  tone: string;
  iconTone: string;
}> = [
  {
    title: "Total Members",
    value: "147",
    icon: Users,
    tone: "bg-cat-6-soft",
    iconTone: "text-cat-6",
  },
  {
    title: "Active",
    value: "00",
    icon: Radar,
    tone: "bg-cat-4-soft",
    iconTone: "text-cat-4",
  },
  {
    title: "Pending",
    value: "00",
    icon: Bell,
    tone: "bg-cat-3-soft",
    iconTone: "text-cat-3",
  },
  {
    title: "Inactive",
    value: "00",
    icon: Radar,
    tone: "bg-cat-1-soft",
    iconTone: "text-cat-1",
  },
];

const members = [
  {
    initials: "SM",
    name: "Rony joe",
    id: "MM-123123",
    email: "example@!gmail.com",
    phone: "(702) 555-0122",
    subscription: "Full Membership",
    status: "Active",
    joined: "12 April,2026",
  },
  {
    initials: "MD",
    name: "Alicia Keys",
    id: "MM-987654",
    email: "alicia.keys@example.com",
    phone: "(415) 555-0199",
    subscription: "Journal Only",
    status: "Active",
    joined: "5 May,2027",
  },
  {
    initials: "LG",
    name: "Marcus Lee",
    id: "MM-456789",
    email: "marcus.lee@mail.com",
    phone: "(212) 555-0147",
    subscription: "Class Purchase",
    status: "Expired",
    joined: "20 March,2025",
  },
  {
    initials: "SM",
    name: "Elena Fisher",
    id: "MM-321654",
    email: "elena.fisher@mail.com",
    phone: "(303) 555-0110",
    subscription: "Full Membership",
    status: "Active",
    joined: "15 June,2026",
  },
  {
    initials: "MD",
    name: "Jamal Turner",
    id: "MM-654321",
    email: "jamal.turner@example.org",
    phone: "(718) 555-0133",
    subscription: "Journal Only",
    status: "Expired",
    joined: "1 January,2024",
  },
  {
    initials: "LG",
    name: "Sofia Martinez",
    id: "MM-789123",
    email: "sofia.martinez@webmail.net",
    phone: "(512) 555-0177",
    subscription: "Class Purchase",
    status: "Active",
    joined: "10 November,2026",
  },
  {
    initials: "SM",
    name: "David Kim",
    id: "MM-159753",
    email: "david.kim@domain.com",
    phone: "(213) 555-0155",
    subscription: "Full Membership",
    status: "Active",
    joined: "22 August,2027",
  },
  {
    initials: "LG",
    name: "Omar Hassan",
    id: "MM-852369",
    email: "omar.hassan@mail.com",
    phone: "(305) 555-0129",
    subscription: "Class Purchase",
    status: "Active",
    joined: "30 December,2026",
  },
  {
    initials: "SM",
    name: "Nina Gupta",
    id: "MM-963852",
    email: "nina.gupta@service.org",
    phone: "(917) 555-0166",
    subscription: "Full Membership",
    status: "Expired",
    joined: "18 February,2023",
  },
];

function SummaryCard({ card }: { card: (typeof summaryCards)[number] }) {
  return (
    <Card as="article" padding="none" className="min-h-[114px] p-inset-lg">
      <div className="mb-stack-xl flex items-start justify-between gap-inline-lg">
        <p className="text-body-md text-fg-muted">{card.title}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-control ${card.tone}`}
        >
          <card.icon className={`h-5 w-5 ${card.iconTone}`} />
        </span>
      </div>
      <p className="text-metric-sm text-fg">{card.value}</p>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <Badge tone={status === "Active" ? "success" : "danger"}>{status}</Badge>
  );
}

const PAGE_SIZE = 10;

function MembersTable() {
  /* Search and paging were both drawn but not wired: the chevrons had no
     handlers and the count was the literal string "1-10 of 20". */
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) =>
      [member.name, member.email, member.id, member.subscription].some(
        (field) => field.toLowerCase().includes(q),
      ),
    );
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <Card as="section" padding="small">
      <div className="mb-stack-md flex flex-col gap-inline-lg sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-4 text-fg">Members</h1>
        <div className="relative w-full sm:w-[277px]">
          <label htmlFor="member-search" className="sr-only">
            Search members
          </label>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-fg-muted"
          />
          <Input
            id="member-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={1080}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              {["Member", "Contact", "Subscriptions", "Status", "Joined"].map(
                (header) => (
                  <TableHeaderCell key={header}>{header}</TableHeaderCell>
                ),
              )}
              <TableHeaderCell className="text-center">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <span className="flex items-center gap-inline-lg">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-cat-4-soft text-label-sm text-fg"
                    >
                      {member.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-label-md text-fg">
                        {member.name}
                      </span>
                      <span className="block truncate text-caption text-fg-muted">
                        {member.id}
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block max-w-[190px] truncate text-label-md text-fg">
                    {member.email}
                  </span>
                  <span className="block text-caption text-fg-muted">
                    {member.phone}
                  </span>
                </TableCell>
                <TableCell>{member.subscription}</TableCell>
                <TableCell>
                  <StatusPill status={member.status} />
                </TableCell>
                <TableCell>
                  <span className="block max-w-[135px] truncate">
                    {member.joined}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="neutral"
                    appearance="stroke"
                    size="small"
                    className="px-inset-xs"
                    aria-label={`View ${member.name}`}
                  >
                    <Eye aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        summary={
          filtered.length === 0
            ? "No members match this search"
            : `${start + 1}–${start + visible.length} of ${filtered.length}`
        }
      />
    </Card>
  );
}

export default function MembersPage() {
  return (
    <>
      <section className="grid grid-cols-1 gap-inset-lg sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} card={card} />
        ))}
      </section>

      <div className="mt-stack-lg">
        <MembersTable />
      </div>
    </>
  );
}
