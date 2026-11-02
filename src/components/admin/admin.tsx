"use client";
import { useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building2,
  Inbox,
  Users,
  Archive,
  Plus,
  LockKeyhole,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Brand } from "@/components/portal/parts";
import { SearchBar } from "@/components/portal/search-bar";
import { AccountMenu } from "@/components/portal/account-menu";
import { UploadField } from "@/components/admin/upload-field";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";
import { propertyImage } from "@/lib/property-images";
import { assetClasses, regions } from "@/data";
import { adminCurrencies, adminTenures } from "@/lib/admin-property-options";
import type { adminData } from "@/lib/admin";
import "./admin.css";
type Data = Awaited<ReturnType<typeof adminData>>;
type Opportunity = Data["properties"][number];
type Person = Data["users"][number];
type RequestEntry = Data["requests"][number];
const blank = {
  name: "",
  city: "",
  country: "",
  region: "UK",
  asset: "Offices",
  currency: "GBP",
  price: null,
  yield: null,
  annualIncome: null,
  area: null,
  tenure: "Not stated",
  summary: "",
  highlights: [],
  confidential: false,
  publication: "draft",
};
function Picker({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((v) => (
          <SelectItem key={v} value={v}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Admin({ data }: { data: Data }) {
  return (
    <SidebarProvider
      className="app-shell"
      mobileBreakpoint={1024}
      style={
        {
          "--sidebar-width": "var(--sidebar)",
          "--sidebar-width-icon": "72px",
        } as CSSProperties
      }
    >
      <Workspace data={data} />
    </SidebarProvider>
  );
}
function Workspace({ data }: { data: Data }) {
  const router = useRouter();
  const { open, isMobile, setOpenMobile } = useSidebar();
  const compact = !isMobile && !open;
  const [section, setSection] = useState("Opportunities");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [limit, setLimit] = useState(100);
  const [region, setRegion] = useState("All regions");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Opportunity | null | undefined>();
  const [person, setPerson] = useState<Person | null | undefined>();
  const [review, setReview] = useState<RequestEntry | null>(null);
  const [link, setLink] = useState("");
  const [nda, setNda] = useState(false);
  const navigation = [
    { name: "Opportunities", icon: Building2 },
    { name: "Requests", icon: Inbox },
    ...(data.actor.role === "owner" ? [{ name: "Users", icon: Users }] : []),
    { name: "Archive", icon: Archive },
  ];
  async function mutate(action: string, payload: unknown) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data: payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.refresh();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  function changeSection(next: string) {
    setSection(next);
    setSearch("");
    setFilter("All");
    setNotice("");
    setError("");
    setOpenMobile(false);
  }
  const properties = data.properties.filter(
    (p) =>
      (section === "Archive"
        ? p.publication === "archived"
        : p.publication !== "archived") &&
      (filter === "All" || p.publication === filter.toLowerCase()) &&
      (region === "All regions" || p.region === region) &&
      `${p.name} ${p.city} ${p.country}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const users = data.users.filter(
    (p) =>
      (filter === "All" ||
        (filter === "Clients" ? p.role === "client" : p.role !== "client")) &&
      `${p.name} ${p.email} ${p.company}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const requests = data.requests.filter(
    (r) =>
      (filter === "All" || r.status === filter.toLowerCase()) &&
      `${r.user.name} ${r.property.name} ${r.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Sidebar className="portal-sidebar" collapsible="icon">
        <aside
          className="sidebar"
          data-compact={compact}
          aria-label="Administration navigation"
        >
          <SidebarHeader className="portal-sidebar-header">
            <Link
              href="/admin"
              className={
                compact
                  ? "sidebar-brand sidebar-brand-compact"
                  : "sidebar-brand"
              }
              aria-label="Knight Frank administration"
            >
              <Brand iconOnly={compact} />
            </Link>
          </SidebarHeader>
          <SidebarContent className="portal-sidebar-content">
            <nav aria-label="Administration">
              <SidebarMenu>
                {navigation.map((n) => (
                  <SidebarMenuItem key={n.name}>
                    <SidebarMenuButton
                      tooltip={n.name}
                      className={
                        "nav-item " + (section === n.name ? "active" : "")
                      }
                      isActive={section === n.name}
                      onClick={() => changeSection(n.name)}
                    >
                      <n.icon size={19} />
                      <span className="nav-text">{n.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarContent>
          <SidebarFooter className="sidebar-bottom">
            <AccountMenu
              user={data.actor}
              subtitle={data.actor.role === "owner" ? "Owner" : "Administrator"}
              showInvestorPortal
              onSignOut={async () => {
                try {
                  const result = await authClient.signOut();
                  if (result.error)
                    throw new Error(
                      result.error.message || "Unable to sign out.",
                    );
                  router.push("/admin/login");
                  router.refresh();
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Unable to sign out. Please try again.",
                  );
                }
              }}
            />
          </SidebarFooter>
        </aside>
        <SidebarRail />
      </Sidebar>
      <div className="app-body admin-body">
        <header className="topbar">
          <div className="od-row">
            <SidebarTrigger className="portal-sidebar-trigger" />
            <span className="topbar-title">Global Investment Portal</span>
            <span className="topbar-divider" />
            <span className="topbar-subtitle">Administration</span>
          </div>
        </header>
        <main className="page-content admin-content">
          <div className="page-intro admin-heading">
            <div>
              <span className="eyebrow">KNIGHT FRANK PRIVATE OFFICE</span>
              <h1>{section}</h1>
              <p className="muted">
                {section === "Users"
                  ? "Manage your team and client access."
                  : section === "Requests"
                    ? "Connect with investors and review confidential access."
                    : section === "Archive"
                      ? "Retain withdrawn opportunities and restore them as drafts."
                      : "Prepare and manage your global investment opportunities."}
              </p>
            </div>
            {section === "Opportunities" && (
              <Button onClick={() => setEditing(null)}>
                <Plus />
                Add opportunity
              </Button>
            )}
            {section === "Users" && (
              <Button
                onClick={() => {
                  setLink("");
                  setPerson(null);
                }}
              >
                <Plus />
                Invite user
              </Button>
            )}
          </div>
          {error && (
            <div className="admin-message error-summary" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="admin-message" role="status">
              {notice}
            </div>
          )}
          <div className="admin-toolbar">
            <SearchBar
              className="admin-search"
              label={`Search ${section.toLowerCase()}`}
              placeholder={
                ["Opportunities", "Archive"].includes(section)
                  ? "Search by property, city or country"
                  : `Search ${section.toLowerCase()}…`
              }
              value={search}
              onChange={setSearch}
            />
            {section !== "Archive" && (
              <Picker
                label="Filter records"
                value={filter}
                onChange={setFilter}
                options={
                  section === "Users"
                    ? ["All", "Team", "Clients"]
                    : section === "Requests"
                      ? ["All", "Pending", "Reviewed", "Approved", "Declined"]
                      : ["All", "Published", "Draft"]
                }
              />
            )}
            {["Opportunities", "Archive"].includes(section) && (
              <Picker
                label="Region"
                value={region}
                onChange={setRegion}
                options={["All regions", ...regions]}
              />
            )}
          </div>
          <div className="admin-table">
            <Table>
              <TableHeader>
                <TableRow>
                  {(section === "Users"
                    ? [
                        "User",
                        "Company",
                        "Role",
                        "Status",
                        "Recent sign-in",
                        "",
                      ]
                    : section === "Requests"
                      ? [
                          "Investor",
                          "Opportunity",
                          "Request",
                          "Status",
                          "Received",
                          "",
                        ]
                      : [
                          "Opportunity",
                          "Region",
                          "Asking price",
                          "Yield",
                          "Status",
                          "Access",
                          "",
                        ]
                  ).map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {["Opportunities", "Archive"].includes(section) &&
                  properties.slice(0, limit).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="admin-property">
                          <Image
                            {...propertyImage(p)}
                            alt=""
                            className="admin-thumbnail"
                          />
                          <div>
                            <strong>{p.name}</strong>
                            <span>
                              {p.city} · {p.asset}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{p.region}</TableCell>
                      <TableCell>
                        {p.price === null
                          ? "On application"
                          : `${p.currency} ${p.price.toLocaleString()}m`}
                      </TableCell>
                      <TableCell>
                        {p.yield === null ? "—" : `${p.yield}%`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.publication}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.confidential ? "Confidential" : "Standard"}
                      </TableCell>
                      <TableCell>
                        <div className="admin-row-actions">
                          <Button variant="ghost" onClick={() => setEditing(p)}>
                            Edit
                          </Button>
                          <Button
                            disabled={busy}
                            variant="ghost"
                            onClick={() => {
                              void mutate("publication", {
                                id: p.id,
                                publication:
                                  section === "Archive" ? "draft" : "archived",
                              }).catch(() => {});
                            }}
                          >
                            {section === "Archive"
                              ? "Restore draft"
                              : "Archive"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                {section === "Users" &&
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <strong>{u.name}</strong>
                        <div className="muted">{u.email}</div>
                      </TableCell>
                      <TableCell>{u.company || "—"}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.sessions[0]
                          ? new Date(
                              u.sessions[0].createdAt,
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setLink("");
                            setPerson(u);
                          }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {section === "Requests" &&
                  requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <strong>{r.user.name}</strong>
                        <div className="muted">{r.email}</div>
                      </TableCell>
                      <TableCell>{r.property.name}</TableCell>
                      <TableCell>
                        {r.kind === "access" ? "Document access" : "Enquiry"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setReview(r);
                            setNda(false);
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {(section === "Users"
                  ? users.length
                  : section === "Requests"
                    ? requests.length
                    : properties.length) === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="admin-empty">
                        No {section.toLowerCase()} match this view.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="admin-count">
            {section === "Users"
              ? users.length
              : section === "Requests"
                ? requests.length
                : properties.length}{" "}
            records
            {properties.length > limit &&
            ["Opportunities", "Archive"].includes(section)
              ? ` · Showing ${limit}.`
              : ""}
          </p>
          {["Opportunities", "Archive"].includes(section) &&
            properties.length > limit && (
              <Button
                variant="outline"
                onClick={() => setLimit((v) => v + 100)}
              >
                Show more opportunities
              </Button>
            )}
        </main>
      </div>
      <Dialog
        open={editing !== undefined}
        onOpenChange={(v) => {
          if (!v && !busy) setEditing(undefined);
        }}
      >
        <DialogContent className="admin-dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit opportunity" : "Add opportunity"}
            </DialogTitle>
            <DialogDescription>
              Save your work as a draft, then preview before publishing.
            </DialogDescription>
          </DialogHeader>
          {editing !== undefined && (
            <PropertyEditor
              key={editing?.id || "new"}
              property={editing}
              busy={busy}
              error={error}
              save={async (value, files) => {
                const result = await mutate("property", value);
                let uploadError = "";
                for (const { file, kind } of files) {
                  const form = new FormData();
                  form.set("propertyId", result.id);
                  form.set("kind", kind);
                  form.set("file", file);
                  const response = await fetch("/api/admin/materials", {
                    method: "POST",
                    body: form,
                  });
                  if (!response.ok) {
                    uploadError = (await response.json()).error;
                    break;
                  }
                }
                router.refresh();
                if (uploadError) {
                  setError(`Property saved. ${uploadError}`);
                  setEditing({ ...value, id: result.id } as Opportunity);
                  return;
                }
                setEditing(undefined);
                setNotice("Opportunity saved.");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={person !== undefined}
        onOpenChange={(v) => {
          if (!v && !busy) setPerson(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{person ? "Manage user" : "Invite user"}</DialogTitle>
            <DialogDescription>
              {person
                ? "Update access to the investment portal."
                : "Create an invitation. The recipient chooses their own password."}
            </DialogDescription>
          </DialogHeader>
          {person !== undefined && (
            <UserEditor
              key={person?.id || "new"}
              person={person}
              busy={busy}
              error={error}
              link={link}
              submit={async (action, value) => {
                const result = await mutate(action, value);
                if (result.link) {
                  setLink(result.link);
                } else {
                  setPerson(undefined);
                  setNotice("User access updated.");
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!review}
        onOpenChange={(v) => {
          if (!v) setReview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {review?.kind === "access"
                ? "Review document access"
                : "Review enquiry"}
            </DialogTitle>
            <DialogDescription>
              {review?.user.name} · {review?.property.name}
            </DialogDescription>
          </DialogHeader>
          <p>
            {review?.message ||
              "The investor has requested the investment memorandum."}
          </p>
          <p className="muted">Contact: {review?.email}</p>
          {review?.kind === "access" && (
            <label className="admin-check">
              <input
                type="checkbox"
                checked={nda}
                onChange={(e) => setNda(e.target.checked)}
              />
              I have reviewed the confidentiality / NDA requirement.
            </label>
          )}
          {error && <p role="alert">{error}</p>}
          <div className="admin-actions">
            {review?.kind === "access" && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  void mutate("request", { id: review.id, status: "declined" })
                    .then(() => setReview(null))
                    .catch(() => {});
                }}
              >
                Decline / revoke
              </Button>
            )}
            <Button
              disabled={busy || (review?.kind === "access" && !nda)}
              onClick={() => {
                void mutate("request", {
                  id: review?.id,
                  status: review?.kind === "access" ? "approved" : "reviewed",
                  ndaReviewed: nda,
                })
                  .then(() => setReview(null))
                  .catch(() => {});
              }}
            >
              {review?.kind === "access" ? "Approve access" : "Mark reviewed"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
function PropertyEditor({
  property,
  busy,
  error,
  save,
}: {
  property: Opportunity | null;
  busy: boolean;
  error: string;
  save: (
    value: Record<string, unknown>,
    files: { file: File; kind: string }[],
  ) => Promise<void>;
}) {
  const [tab, setTab] = useState("details");
  const [preview, setPreview] = useState(false);
  const [values, setValues] = useState({ ...blank, ...property });
  const [files, setFiles] = useState<{ file: File; kind: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: unknown) =>
    setValues((v) => ({ ...v, [key]: value }));
  async function submit(publication: string) {
    setSaving(true);
    try {
      await save({ ...values, publication }, files);
    } catch {
    } finally {
      setSaving(false);
    }
  }
  const textField = (
    key: "name" | "city" | "country" | "summary",
    label: string,
  ) => (
    <div className="admin-field">
      <Label htmlFor={`property-${key}`}>{label}</Label>
      {key === "summary" ? (
        <Textarea
          id={`property-${key}`}
          value={values[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      ) : (
        <Input
          id={`property-${key}`}
          value={values[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      )}
    </div>
  );
  return (
    <>
      <Tabs className="admin-editor-tabs" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="details">Property details</TabsTrigger>
          <TabsTrigger value="metrics">Investment metrics</TabsTrigger>
          <TabsTrigger value="media">Media & access</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <div className="admin-form-grid">
            {textField("name", "Property name")}
            {textField("city", "City")}
            {textField("country", "Country")}
            <div className="admin-field">
              <Label>Region</Label>
              <Picker
                label="Property region"
                value={values.region}
                options={regions}
                onChange={(v) => update("region", v)}
              />
            </div>
            <div className="admin-field">
              <Label>Asset class</Label>
              <Picker
                label="Asset class"
                value={values.asset}
                options={assetClasses.slice(1)}
                onChange={(v) => update("asset", v)}
              />
            </div>
            {textField("summary", "Investment summary")}
            <div className="admin-field admin-wide">
              <Label htmlFor="property-highlights">
                Investment highlights (one per line)
              </Label>
              <Textarea
                id="property-highlights"
                value={values.highlights.join("\n")}
                onChange={(e) =>
                  update("highlights", e.target.value.split("\n"))
                }
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="metrics">
          <div className="admin-form-grid">
            <div className="admin-field">
              <Label>Currency</Label>
              <Picker
                label="Currency"
                value={values.currency}
                options={[...adminCurrencies]}
                onChange={(v) => update("currency", v)}
              />
            </div>
            <div className="admin-field">
              <Label>Tenure</Label>
              <Picker
                label="Tenure"
                value={values.tenure}
                options={[...adminTenures]}
                onChange={(v) => update("tenure", v)}
              />
            </div>
            {(["price", "yield", "annualIncome", "area"] as const).map(
              (key, i) => (
                <div className="admin-field" key={key}>
                  <Label htmlFor={"property-" + key}>
                    {
                      [
                        "Asking price (millions)",
                        "Net yield (%)",
                        "Annual income (selected currency)",
                        "Floor area (m²)",
                      ][i]
                    }
                  </Label>
                  <Input
                    id={"property-" + key}
                    type="number"
                    min="0"
                    step={key === "area" ? "1" : "any"}
                    value={values[key] ?? ""}
                    onChange={(e) =>
                      update(
                        key,
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </div>
              ),
            )}
          </div>
          <p className="muted">Leave unknown figures blank.</p>
        </TabsContent>
        <TabsContent value="media">
          <div className="admin-media-panel">
            {(["photo", "im"] as const).map((kind) => (
              <UploadField
                key={kind}
                kind={kind}
                files={files
                  .filter((entry) => entry.kind === kind)
                  .map((entry) => entry.file)}
                saved={property?.materials?.filter(
                  (material) => material.kind === kind,
                )}
                disabled={busy || saving}
                onChange={(selected) =>
                  setFiles((current) => [
                    ...current.filter((entry) => entry.kind !== kind),
                    ...selected.map((file) => ({ file, kind })),
                  ])
                }
              />
            ))}
            <div className="admin-access-setting">
              <LockKeyhole size={20} aria-hidden="true" />
              <Label htmlFor="property-confidential">
                <strong>Confidential opportunity</strong>
                <span>
                  Investors must receive approval before downloading the
                  memorandum.
                </span>
              </Label>
              <Checkbox
                id="property-confidential"
                checked={values.confidential}
                disabled={busy || saving}
                onCheckedChange={(checked) =>
                  update("confidential", checked === true)
                }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {preview && (
        <div className="admin-preview">
          <span className="eyebrow">LISTING PREVIEW</span>
          <h2>{values.name || "Untitled opportunity"}</h2>
          <p>
            {values.city} · {values.country} · {values.asset}
          </p>
          <p>
            {values.price === null
              ? "Price on application"
              : `${values.currency} ${values.price}m`}{" "}
            ·{" "}
            {values.yield === null
              ? "Yield not supplied"
              : `${values.yield}% yield`}{" "}
            · {values.tenure}
          </p>
          <p>{values.summary}</p>
          <ul>
            {values.highlights.filter(Boolean).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p role="alert" className="error-summary">
          {error}
        </p>
      )}
      <div className="admin-actions">
        <Button variant="ghost" onClick={() => setPreview(!preview)}>
          Preview listing
        </Button>
        <Button
          variant="outline"
          disabled={busy || saving}
          onClick={() => void submit("draft")}
        >
          Save draft
        </Button>
        <Button
          disabled={busy || saving}
          onClick={() => void submit("published")}
        >
          {saving ? "Saving…" : "Publish opportunity"}
        </Button>
      </div>
    </>
  );
}
function UserEditor({
  person,
  busy,
  error,
  link,
  submit,
}: {
  person: Person | null;
  busy: boolean;
  error: string;
  link: string;
  submit: (action: string, value: unknown) => Promise<void>;
}) {
  const [name, setName] = useState(person?.name || "");
  const [email, setEmail] = useState(person?.email || "");
  const [company, setCompany] = useState(person?.company || "");
  const [role, setRole] = useState(person?.role || "client");
  const [status, setStatus] = useState(person?.status || "active");
  const [copied, setCopied] = useState(false);
  async function send(e: FormEvent) {
    e.preventDefault();
    try {
      await submit(
        person ? "user" : "invite",
        person
          ? { id: person.id, role, status }
          : { name, email, company, role },
      );
    } catch {}
  }
  return (
    <form onSubmit={send} className="admin-user-form">
      {!person && (
        <>
          <div className="admin-field">
            <Label htmlFor="invite-name">Full name</Label>
            <Input
              id="invite-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <Label htmlFor="invite-company">Company</Label>
            <Input
              id="invite-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </>
      )}
      {person && (
        <p>
          {person.name}
          <br />
          <span className="muted">
            {person.email} · {person.company}
          </span>
        </p>
      )}
      {person?.status !== "invited" && (
        <>
          <div className="admin-field">
            <Label>Role</Label>
            <Picker
              label="User role"
              value={role}
              onChange={setRole}
              options={["client", "admin", "owner"]}
            />
          </div>
          {person && (
            <div className="admin-field">
              <Label>Account status</Label>
              <Picker
                label="Account status"
                value={status}
                onChange={setStatus}
                options={["active", "deactivated"]}
              />
            </div>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="error-summary">
          {error}
        </p>
      )}
      {link && (
        <div className="admin-invite-result">
          <Label htmlFor="invitation-link">
            Invitation link · expires in 7 days
          </Label>
          <Input id="invitation-link" value={link} readOnly />
          <p className="muted">
            Share this private link with the intended recipient. No email has
            been sent.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy invitation link"}
          </Button>
        </div>
      )}
      <div className="admin-actions">
        {person?.status === "invited" ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              void submit("resend", { id: person.id }).catch(() => {});
            }}
          >
            Reissue invitation
          </Button>
        ) : (
          <Button disabled={busy || !!link} type="submit">
            {busy ? "Saving…" : person ? "Save changes" : "Create invitation"}
          </Button>
        )}
      </div>
    </form>
  );
}
