"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  examplePrompts,
  income,
  yieldText,
  areaText,
  pricePerArea,
  money,
  shortAsset,
  type Filters,
  type Property,
} from "@/data";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/client-api";
import type { AssistantReply, SearchPlan } from "@/lib/assistant";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Building2,
  Check,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  LockKeyhole,
  MapPin,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { propertyImage } from "@/lib/property-images";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
export function Brand({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <Image
      className={iconOnly ? "brand-icon" : "brand-logo"}
      src={
        iconOnly ? "/assets/knight-frank-icon.svg" : "/assets/knight-frank.svg"
      }
      width={iconOnly ? 40 : 105}
      height={40}
      alt="Knight Frank"
    />
  );
}

export function FieldSelect({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  id: string;
}) {
  return (
    <div className="od-field select-field">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          side="bottom"
          avoidCollisions={false}
          collisionPadding={8}
        >
          {options.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="od-stat metric">
      <span className="metric-label">{label}</span>
      <strong className="od-nowrap">{value}</strong>
    </div>
  );
}

export function Login({ returnTo = "/overview" }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("investor@example.com"),
    [password, setPassword] = useState("KnightFrank2026!"),
    [show, setShow] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(false),
    [help, setHelp] = useState(false);
  const validate = (key: string, value: string) => {
    const error =
      key === "email"
        ? !/^\S+@\S+\.\S+$/.test(value)
          ? "Enter a complete email address."
          : ""
        : !value
          ? "Enter your password."
          : "";
    setErrors((e) => ({ ...e, [key]: error }));
    return error;
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validate("email", email);
    const passwordError = validate("password", password);
    if (emailError || passwordError) return;
    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (result.error)
        throw new Error(result.error.message || "Unable to sign in.");
      router.replace(returnTo);
      router.refresh();
    } catch (error) {
      setErrors({
        credentials:
          error instanceof Error ? error.message : "Unable to sign in.",
      });
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <header className="login-header">
        <Brand />
        <div className="login-wordmark">GLOBAL INVESTMENT PORTAL</div>
        <span className="login-top-note">
          <Globe2 size={16} /> A global perspective
        </span>
      </header>
      <main className="login-main">
        <section className="login-image" aria-label="London skyline">
          <div className="image-top">
            <span className="eyebrow light">YOUR NEXT OPPORTUNITY</span>
            <span className="image-index">01 / GLOBAL</span>
          </div>
          <div className="login-story">
            <span className="red-rule" />
            <h1>
              Global perspective.
              <br />
              Personal opportunity.
            </h1>
            <p>
              Discover real estate investments across markets, sectors and
              possibilities.
            </p>
            <div className="story-footer">
              <span>London, United Kingdom</span>
              <ArrowUpRight size={24} />
            </div>
          </div>
        </section>
        <section className="login-form-wrap">
          <div className="login-form-inner">
            <div className="eyebrow">PRIVATE CLIENT ACCESS</div>
            <h2>
              Welcome to your
              <br />
              investment world.
            </h2>
            <p className="muted login-intro">
              A considered view of global real estate.
              <br />
              Sign in to discover your next opportunity.
            </p>
            <form onSubmit={submit} noValidate className="od-stack login-form">
              <div className="od-field">
                <Label htmlFor="email">
                  Email address <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validate("email", email)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="field-error">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="od-field">
                <Label htmlFor="password">
                  Password <span aria-hidden="true">*</span>
                </Label>
                <div className="password-field">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => validate("password", password)}
                    aria-invalid={!!errors.password}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="password-toggle"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="field-error">{errors.password}</p>
                )}
              </div>
              {errors.credentials && (
                <p role="alert" className="field-error">
                  {errors.credentials}
                </p>
              )}
              <div className="login-options">
                <span>
                  <LockKeyhole size={14} /> Private investor portal
                </span>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setHelp(true)}
                >
                  Need help?
                </Button>
              </div>
              <Button className="login-submit" disabled={loading} type="submit">
                {loading ? "Signing you in…" : "Sign in to the portal"}
                {!loading && <ArrowRight size={18} />}
              </Button>
              {loading && (
                <div
                  className="loading-line"
                  role="progressbar"
                  aria-label="Signing in"
                />
              )}
            </form>
            <p className="login-bottom">
              Exceptional property. Personal service.
            </p>
          </div>
        </section>
      </main>
      <footer className="login-footer">
        <span>Independent thinking. Global expertise.</span>
      </footer>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help signing in</DialogTitle>
            <DialogDescription>
              Access to the portal is by invitation.
            </DialogDescription>
          </DialogHeader>
          <p>
            Contact your portal administrator if you need an account or help
            accessing your existing account.
          </p>
          <Button
            onClick={() => {
              setHelp(false);
            }}
          >
            Back to sign in
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PropertyCard({
  p,
  saved,
  compared,
  onOpen,
  onSave,
  onCompare,
}: {
  p: Property;
  saved: boolean;
  compared: boolean;
  onOpen: () => void;
  onSave: () => void;
  onCompare: () => void;
}) {
  const metadata = [
    p.area === null ? "" : areaText(p),
    p.tenure === "Not stated" ? "" : p.tenure,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="property-card od-tile">
      <div className="property-image">
        <button
          className="image-link"
          onClick={onOpen}
          aria-label={`View ${p.name}`}
        >
          <Image
            className="od-media od-media-cover"
            {...propertyImage(p)}
            alt={p.name}
            loading="lazy"
          />
        </button>
        {p.label && (
          <Badge variant="secondary" className="image-badge">
            {p.label}
          </Badge>
        )}
        <Button
          variant="secondary"
          size="icon"
          className={"save-button " + (saved ? "is-saved" : "")}
          onClick={onSave}
          aria-label={
            saved ? `Remove ${p.name} from shortlist` : `Save ${p.name}`
          }
          aria-pressed={saved}
        >
          <Bookmark fill={saved ? "currentColor" : "none"} />
        </Button>
        {p.confidential && (
          <span className="confidential-badge">
            <LockKeyhole size={12} /> Confidential
          </span>
        )}
      </div>
      <div className="property-body">
        <div className="property-kicker">
          <span>{shortAsset(p.asset)}</span>
          <span>{p.region}</span>
        </div>
        <button className="property-title" onClick={onOpen}>
          <h3>{p.name}</h3>
          <ArrowUpRight size={20} />
        </button>
        <p className="property-location">
          <MapPin size={14} />
          {p.city}, {p.country}
        </p>
        <div className="card-metrics">
          <Metric label="Asking price" value={money(p)} />
          <Metric
            label="Net yield"
            value={p.yield === null ? "—" : yieldText(p)}
          />
        </div>
        <div className="property-footer">
          <span>{metadata}</span>
          <label className="compare-checkbox">
            <Checkbox
              checked={compared}
              onCheckedChange={onCompare}
              aria-label={`Compare ${p.name}`}
            />
            <span>Compare</span>
          </label>
        </div>
      </div>
    </article>
  );
}

export function PropertyDetail({
  p,
  onBack,
  saved,
  compared,
  onSave,
  onCompare,
  onAction,
  accessPending,
}: {
  p: Property;
  onBack: () => void;
  saved: boolean;
  compared: boolean;
  onSave: () => void;
  onCompare: () => void;
  onAction: (kind: "access" | "enquiry") => void;
  accessPending: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const download = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(
        `/api/properties/${encodeURIComponent(p.id)}/memorandum`,
      );
      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.error ||
            "Unable to download the memorandum. Please try again.",
        );
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "sample-investment-memorandum.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Allow the browser to start reading the file before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Unable to download the memorandum. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };
  const memorandumButton = (compact = false) => (
    <Button
      variant="outline"
      disabled={downloading || (!!p.confidential && accessPending)}
      onClick={() => (p.confidential ? onAction("access") : void download())}
    >
      {p.confidential ? (
        accessPending ? (
          <CheckCircle2 />
        ) : (
          <LockKeyhole />
        )
      ) : (
        <Download />
      )}
      {p.confidential
        ? accessPending
          ? "Access request pending"
          : "Request access"
        : downloading
          ? "Downloading…"
          : compact
            ? "Download IM"
            : "Download investment memorandum"}
    </Button>
  );
  return (
    <div className="page-content detail-page">
      <div className="detail-heading">
        <div>
          <div className="detail-kicker">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="detail-back-button"
              aria-label="Back to results"
              title="Back to results"
            >
              <ArrowLeft />
            </Button>
            <span className="eyebrow">
              {shortAsset(p.asset)} / {p.region}
            </span>
          </div>
          <h1>{p.name}</h1>
          <p className="muted od-row">
            <MapPin size={17} />
            {p.city}, {p.country}
          </p>
        </div>
        <div className="od-row">
          <Button variant="outline" onClick={onSave}>
            <Bookmark fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" onClick={onCompare}>
            {compared ? <Check /> : <Scale />}
            {compared ? "Selected" : "Compare"}
          </Button>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <figure className="detail-photo">
            <Image className="od-media" {...propertyImage(p)} alt={p.name} />
          </figure>
          <Tabs defaultValue="overview">
            <TabsList className="detail-tabs">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financials">Investment metrics</TabsTrigger>
              <TabsTrigger value="documents">Documents & access</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <h2>The investment opportunity</h2>
              <p className="detail-summary">{p.summary}</p>
              <h3 className="section-subtitle">Investment highlights</h3>
              <ul className="highlights">
                {p.highlights.map((h) => (
                  <li key={h}>
                    <Check size={18} />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <div className="detail-data-grid">
                <Metric label="Floor area" value={areaText(p)} />
                <Metric label="Tenure" value={p.tenure} />
                <Metric
                  label="Investment profile"
                  value={p.label || shortAsset(p.asset)}
                />
              </div>
            </TabsContent>
            <TabsContent value="financials">
              <h2>The numbers at a glance</h2>
              <dl className="financial-list">
                {[
                  ["Asking price", money(p)],
                  [p.incomeType || "Reported annual income", income(p)],
                  ["Net yield", yieldText(p)],
                  ["Floor area", areaText(p)],
                  ["Price per m²", pricePerArea(p)],
                  ["Land tenure", p.tenure],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="muted">
                Income is the annual rent or net operating income reported in
                the source, without inferring income from yield. Floor areas are
                converted from square feet and may use different measurement
                bases; see the source notes.
              </p>
            </TabsContent>
            <TabsContent value="documents">
              <h2>Continue your due diligence.</h2>
              <p className="muted">
                {p.confidential
                  ? accessPending
                    ? "Your access request is pending review by the investment team."
                    : "This memorandum is confidential. Request access from the investment team."
                  : "Download the sample investment memorandum for your review."}
              </p>
              <div className="document-row">
                <div className="document-icon">
                  {p.confidential ? (
                    <LockKeyhole size={24} />
                  ) : (
                    <FileText size={24} />
                  )}
                </div>
                <div className="od-field od-fill">
                  <strong>Investment memorandum</strong>
                  <span>
                    {p.confidential
                      ? accessPending
                        ? "Pending review"
                        : "Confidential · Approval required"
                      : "PDF · Sample document"}
                  </span>
                </div>
                {memorandumButton(true)}
              </div>
              {downloadError && (
                <p className="field-error" role="alert">
                  {downloadError}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <aside className="investment-panel">
          <span className="eyebrow">INVESTMENT AT A GLANCE</span>
          <div className="asking-price">
            <span>Asking price</span>
            <strong>{money(p)}</strong>
          </div>
          <div className="investment-metrics">
            <Metric label="Net yield" value={yieldText(p)} />
            <Metric label="Reported annual income" value={income(p)} />
          </div>
          <div className="investment-tenure">
            <span>{p.tenure}</span>
            <span>{shortAsset(p.asset)}</span>
          </div>
          <Button onClick={() => onAction("enquiry")}>
            Enquire about this opportunity <ArrowUpRight />
          </Button>
          {memorandumButton()}
          <p className="memorandum-note muted">
            {p.confidential
              ? accessPending
                ? "Your request is pending review."
                : "Confidential materials require approval."
              : "PDF · Sample document"}
          </p>
          {downloadError && (
            <p className="field-error" role="alert">
              {downloadError}
            </p>
          )}
          <div className="advisor-note">
            <span className="advisor-icon">
              <Building2 size={20} />
            </span>
            <div className="od-field">
              <strong>Your investment advisory team</strong>
              <span>Knight Frank · {p.region}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Assistant({
  open,
  onOpenChange,
  onOpenProperty,
  onApply,
  onCompare,
}: {
  properties: Property[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenProperty: (p: Property) => void;
  onApply: (f: Filters) => void;
  onCompare: (ids: string[]) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const [previous, setPrevious] = useState<SearchPlan | null>(null);
  const [previousIds, setPreviousIds] = useState<string[]>([]);
  useEffect(() => {
    if (open)
      end.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [messages, busy, open]);
  const send = async (q: string) => {
    if (!q.trim() || sending.current) return;
    sending.current = true;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setText("");
    setBusy(true);
    try {
      const reply = await api<AssistantReply>("/api/assistant", {
        message: q.trim(),
        history: messages
          .filter((m) => !m.failed)
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.text.slice(0, 3000) })),
        previous,
        previousIds,
      });
      setPrevious(reply.plan);
      if (reply.result) setPreviousIds(reply.result.results.map((p) => p.id));
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: reply.text,
          result: reply.result,
        },
      ]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Unable to search. Please try again.",
          failed: true,
        },
      ]);
      setText(q);
    } finally {
      setBusy(false);
      sending.current = false;
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="assistant-dialog">
        <SheetHeader className="assistant-header">
          <div className="od-row">
            <span className="assistant-symbol">
              <Sparkles size={20} />
            </span>
            <div>
              <SheetTitle>Investment assistant</SheetTitle>
              <SheetDescription>
                Discover opportunities in your own words.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="assistant-body" aria-live="polite" aria-busy={busy}>
          <div className="assistant-intro">
            <span className="eyebrow">A MORE PERSONAL SEARCH</span>
            <h2>
              What are you
              <br />
              looking for?
            </h2>
            <p>
              Tell me your preferred market, asset class and investment
              criteria.
            </p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setMessages([]);
                setPrevious(null);
                setPreviousIds([]);
                setText("");
              }}
            >
              Start a new conversation
            </Button>
          )}
          <div className="example-prompts">
            {examplePrompts.map((q, i) => (
              <button key={q} disabled={busy} onClick={() => send(q)}>
                <span>
                  {i === 0
                    ? "UK logistics above 6.5%"
                    : i === 1
                      ? "Middle East hotel demos below GBP 20m"
                      : i === 2
                        ? "Compare the top-yielding UK offices"
                        : "Freehold UK retail, GBP 1–20m"}
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          {messages.map((m, i) => (
            <div className={"chat-message " + m.role} key={i}>
              {m.role === "assistant" && (
                <div className="chat-role">
                  <Sparkles size={14} /> INVESTMENT ASSISTANT
                </div>
              )}
              <p>{m.text}</p>
              {m.result && (
                <>
                  <div className="chat-criteria od-cluster">
                    {m.result.criteria?.map((c) => (
                      <Badge key={c} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>
                  {m.result.results?.map((p) => (
                    <button
                      className="chat-result"
                      key={p.id}
                      onClick={() => onOpenProperty(p)}
                    >
                      <div className="od-field">
                        <strong>{p.name}</strong>
                        <span>
                          {p.city} · {money(p)} · {yieldText(p)}
                          {p.id.includes("-demo-") ? " · Sample location" : ""}
                        </span>
                      </div>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                  {m.result.results?.length === 0 && (
                    <p>
                      Try lowering the yield requirement or broadening the
                      region.
                    </p>
                  )}
                  <div className="chat-actions">
                    <Button
                      variant="outline"
                      disabled={m.result.total === 0}
                      onClick={() => onApply(m.result!.filters!)}
                    >
                      Apply search to portal <ArrowRight />
                    </Button>
                    {m.result.compare &&
                      m.result.results &&
                      m.result.results.length >= 2 && (
                        <Button
                          onClick={() =>
                            onCompare(m.result!.results!.map((p) => p.id))
                          }
                        >
                          Compare results <Scale />
                        </Button>
                      )}
                  </div>
                </>
              )}
            </div>
          ))}
          {busy && (
            <div className="assistant-loading" role="status">
              <span>Searching opportunities…</span>
              <div className="loading-line" />
            </div>
          )}
          <div ref={end} />
        </div>
        <form
          className="assistant-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <Label htmlFor="assistant-input">Your investment criteria</Label>
          <div className="od-row">
            <Input
              id="assistant-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Freehold offices in the UK"
              disabled={busy}
              maxLength={2000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !text.trim()}
              aria-label="Send search"
            >
              <Send />
            </Button>
          </div>
          <p>
            Searches use a historical sample catalogue. Availability is
            unverified.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function ActionDialog({
  action,
  onClose,
  initialEmail,
  onAccessRequested,
}: {
  initialEmail: string;
  action: { kind: "access" | "enquiry"; property: Property };
  onClose: () => void;
  onAccessRequested: () => void;
}) {
  const [email, setEmail] = useState(initialEmail),
    [useDifferentEmail, setUseDifferentEmail] = useState(false),
    [message, setMessage] = useState(""),
    [consent, setConsent] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  const access = action.kind === "access";
  const contactEmail = useDifferentEmail ? email.trim() : initialEmail;
  const checkEmail = () => {
    const error =
      !useDifferentEmail || /^\S+@\S+\.\S+$/.test(contactEmail)
        ? ""
        : "Enter a complete email address.";
    setErrors((e) => ({ ...e, email: error }));
    return error;
  };
  const checkMessage = () => {
    const error =
      !access && message.trim().length < 10
        ? "Add at least 10 characters so the advisor can understand your request."
        : "";
    setErrors((e) => ({ ...e, message: error }));
    return error;
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = {
      email: checkEmail(),
      message: checkMessage(),
      consent:
        access && !consent ? "Acknowledge the access terms to continue." : "",
    };
    setErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    try {
      await api("/api/requests", {
        propertyId: action.property.id,
        kind: action.kind,
        ...(useDifferentEmail ? { email: contactEmail } : {}),
        message,
        consent,
      });
      if (access) onAccessRequested();
      setDone(true);
    } catch (error) {
      setErrors({
        server:
          error instanceof Error
            ? error.message
            : "Unable to record your request.",
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="action-dialog">
        <DialogHeader>
          <DialogTitle>
            {done
              ? access
                ? "Access request pending"
                : "Request recorded"
              : access
                ? "Request document access"
                : "Speak to the investment team"}
          </DialogTitle>
          <DialogDescription>
            {action.property.name} · {action.property.city}
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="request-success">
            <CheckCircle2 size={40} />
            <h2>
              {access
                ? "Your request is pending review."
                : "Your interest is noted."}
            </h2>
            <p>
              Your request has been saved with the contact address{" "}
              <strong>{contactEmail}</strong>.
            </p>
            {access && (
              <p>
                The investment team must approve access before confidential
                materials can be downloaded.
              </p>
            )}
            <Button onClick={onClose}>
              Return to the opportunity <ArrowRight />
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="od-stack action-form">
            {Object.values(errors).some(Boolean) && (
              <div className="error-summary" role="alert">
                <strong>Please check your request:</strong>
                {errors.server && <p>{errors.server}</p>}
                {errors.email && <a href="#request-email">Email address</a>}
                {errors.message && <a href="#request-message">Your enquiry</a>}
                {errors.consent && (
                  <a href="#request-consent">Access acknowledgement</a>
                )}
              </div>
            )}
            {access ? (
              <>
                <div className="access-explanation">
                  <ShieldCheck size={24} />
                  <div>
                    <h3>Confidential information, considered access.</h3>
                    <p>
                      The investment team will review your access request. An
                      NDA may be required before materials are shared.
                    </p>
                  </div>
                </div>
                <label className="consent-row">
                  <Checkbox
                    id="request-consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                  />
                  <span>
                    I understand that confidential materials require approval
                    before access.
                  </span>
                </label>
                {errors.consent && (
                  <p className="field-error">{errors.consent}</p>
                )}
              </>
            ) : (
              <div className="od-field">
                <Label htmlFor="request-message">Your enquiry *</Label>
                <Textarea
                  id="request-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you would like to know about this opportunity."
                  aria-invalid={!!errors.message}
                />
                {errors.message && (
                  <p className="field-error">{errors.message}</p>
                )}
              </div>
            )}
            <div className="request-contact">
              {useDifferentEmail ? (
                <div className="od-field">
                  <Label htmlFor="request-email">Contact email *</Label>
                  <Input
                    id="request-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                    maxLength={254}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? "request-email-error" : undefined
                    }
                  />
                  {errors.email && (
                    <p id="request-email-error" className="field-error">
                      {errors.email}
                    </p>
                  )}
                </div>
              ) : (
                <p>
                  We’ll contact you at <strong>{initialEmail}</strong>.
                </p>
              )}
              <Button
                type="button"
                variant="link"
                disabled={busy}
                aria-expanded={useDifferentEmail}
                onClick={() => {
                  setUseDifferentEmail(!useDifferentEmail);
                  setEmail(initialEmail);
                  setErrors((current) => ({ ...current, email: "" }));
                }}
              >
                {useDifferentEmail
                  ? "Use account email"
                  : "Use a different email"}
              </Button>
            </div>
            <Button type="submit" disabled={busy}>
              {busy
                ? "Recording your request…"
                : access
                  ? "Request access"
                  : "Submit enquiry"}
              {!busy && <ArrowRight />}
            </Button>
            {busy && (
              <div
                className="loading-line"
                role="progressbar"
                aria-label="Recording request"
              />
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  result?: AssistantReply["result"];
  failed?: boolean;
};
