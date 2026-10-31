"use client";

import {
  ActionDialog,
  Assistant,
  Brand,
  FieldSelect,
  PropertyCard,
} from "@/components/portal/parts";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/client-api";
import type { Investor } from "@/lib/session";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Building2,
  CheckCircle2,
  Globe2,
  LogOut,
  Menu,
  Scale,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  assetClasses,
  emptyFilters,
  filterProperties,
  regions,
  type Filters,
  type Property,
} from "./data";

type PortalContextValue = {
  properties: Property[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  saved: string[];
  compared: string[];
  view: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
  sort: string;
  setSort: React.Dispatch<React.SetStateAction<string>>;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filterOpen: boolean;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  setCompared: React.Dispatch<React.SetStateAction<string[]>>;
  navigate: (next: string) => void;
  browseRegion: (region: string) => void;
  card: (property: Property) => React.ReactNode;
  setFilter: (key: keyof Filters, value: string) => void;
  filterControls: React.ReactNode;
  applied: (keyof Filters)[];
  results: Property[];
  isSaved: boolean;
  current: Property | undefined;
  priorRoute: React.RefObject<string>;
  toggleSaved: (p: Property) => Promise<void>;
  toggleCompare: (p: Property) => void;
  setAction: React.Dispatch<
    React.SetStateAction<{
      kind: "access" | "enquiry";
      property: Property;
    } | null>
  >;
  openProperty: (p: Property) => void;
};
const PortalContext = createContext<PortalContextValue | null>(null);
export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("Portal screen requires its layout.");
  return context;
}
export default function Portal({
  properties,
  initialSaved,
  user,
  children,
}: {
  properties: Property[];
  initialSaved: string[];
  user: Investor;
  children: React.ReactNode;
}) {
  const router = useRouter(),
    pathname = usePathname();
  const route = pathname === "/shortlist" ? "saved" : pathname.slice(1);
  const pendingSaves = useRef(new Set<string>());
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters }),
    [saved, setSaved] = useState<string[]>(initialSaved),
    [compared, setCompared] = useState<string[]>([]),
    [view, setView] = useState("grid"),
    [sort, setSort] = useState("Recommended"),
    [chatOpen, setChatOpen] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [filterOpen, setFilterOpen] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [toast, setToast] = useState(""),
    [action, setAction] = useState<{
      kind: "access" | "enquiry";
      property: Property;
    } | null>(null);
  const priorRoute = useRef("opportunities"),
    toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  };
  const navigate = (next: string) => {
    setMenuOpen(false);
    if (next === route) window.scrollTo({ top: 0, behavior: "auto" });
    else router.push(next === "saved" ? "/shortlist" : "/" + next);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const openProperty = (p: Property) => {
    priorRoute.current = route.startsWith("property/")
      ? "opportunities"
      : route;
    navigate("property/" + p.id);
  };
  const toggleSaved = async (p: Property) => {
    if (pendingSaves.current.has(p.id)) return;
    pendingSaves.current.add(p.id);
    const has = saved.includes(p.id);
    try {
      await api("/api/shortlist", { propertyId: p.id, saved: !has }, "PUT");
      setSaved((v) =>
        has ? v.filter((id) => id !== p.id) : Array.from(new Set([...v, p.id])),
      );
      notify(
        has
          ? `${p.name} removed from your shortlist.`
          : `${p.name} saved to your shortlist.`,
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Unable to update your shortlist.",
      );
    } finally {
      pendingSaves.current.delete(p.id);
    }
  };
  const toggleCompare = (p: Property) => {
    if (compared.includes(p.id)) {
      setCompared((v) => v.filter((id) => id !== p.id));
      return;
    }
    if (compared.length === 3) {
      notify(
        "You can compare up to three opportunities. Remove one to add another.",
      );
      return;
    }
    setCompared((v) => [...v, p.id]);
  };
  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({
      ...f,
      [key]: value,
      ...(key === "region" ? { country: "All countries" } : {}),
      ...(key === "currency" && value === "All currencies"
        ? { min: "", max: "" }
        : {}),
    }));
  const browseRegion = (r: string) => {
    setFilters({ ...emptyFilters, region: r });
    navigate("opportunities");
  };
  const logout = async () => {
    try {
      const result = await authClient.signOut();
      if (result.error)
        throw new Error(result.error.message || "Unable to sign out.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to sign out.");
    }
  };
  const current = properties.find((p) => "property/" + p.id === route);
  const isSaved = route === "saved";
  const nav = [
    { id: "overview", label: "Global overview", icon: Globe2 },
    { id: "opportunities", label: "Opportunities", icon: Building2 },
    { id: "saved", label: "My shortlist", icon: Bookmark },
  ];
  const activeNav = current
    ? "opportunities"
    : route === "compare"
      ? "saved"
      : route;
  const navContent = (
    <>
      <div className="nav-label">YOUR INVESTMENT WORLD</div>
      <nav aria-label="Main navigation">
        {nav.map((n) => (
          <Button
            key={n.id}
            variant="ghost"
            className={"nav-item " + (activeNav === n.id ? "active" : "")}
            aria-current={activeNav === n.id ? "page" : undefined}
            onClick={() => navigate(n.id)}
          >
            <n.icon size={19} />
            <span>{n.label}</span>
            {n.id === "saved" && (
              <span className="nav-count">{saved.length}</span>
            )}
          </Button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-assistant">
          <span className="assistant-symbol">
            <Sparkles size={20} />
          </span>
          <h3>A different way to search.</h3>
          <p>Tell us what you’re looking for.</p>
          <Button
            variant="outline"
            onClick={() => {
              setMenuOpen(false);
              setChatOpen(true);
            }}
          >
            Ask the assistant <ArrowUpRight />
          </Button>
        </div>
        <div className="sidebar-account">
          <span className="avatar">DI</span>
          <div className="od-field od-fill">
            <strong>{user.name}</strong>
            <span>Private client</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Sign out"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </>
  );

  let results = filterProperties(
    filters,
    isSaved ? properties.filter((p) => saved.includes(p.id)) : properties,
  );
  if (sort === "Highest yield")
    results = [...results].sort((a, b) => b.yield - a.yield);
  if (sort === "Name A–Z")
    results = [...results].sort((a, b) => a.name.localeCompare(b.name));
  const card = (p: Property) => (
    <PropertyCard
      key={p.id}
      p={p}
      saved={saved.includes(p.id)}
      compared={compared.includes(p.id)}
      onOpen={() => openProperty(p)}
      onSave={() => toggleSaved(p)}
      onCompare={() => toggleCompare(p)}
    />
  );
  const filterControls = (
    <div className="filter-fields">
      <FieldSelect
        id="region"
        label="Region"
        value={filters.region}
        onChange={(v) => setFilter("region", v)}
        options={["All regions", ...regions]}
      />
      <FieldSelect
        id="country"
        label="Country"
        value={filters.country}
        onChange={(v) => setFilter("country", v)}
        options={[
          "All countries",
          ...Array.from(
            new Set(
              properties
                .filter(
                  (p) =>
                    filters.region === "All regions" ||
                    p.region === filters.region,
                )
                .map((p) => p.country),
            ),
          ),
        ]}
      />
      <FieldSelect
        id="asset"
        label="Asset class"
        value={filters.asset}
        onChange={(v) => setFilter("asset", v)}
        options={assetClasses}
      />
      <div className="filter-more">
        <Button
          variant="outline"
          onClick={() => setAdvanced(!advanced)}
          aria-expanded={advanced}
        >
          <SlidersHorizontal size={17} /> More filters
        </Button>
      </div>
      {advanced && (
        <div className="advanced-filters">
          <FieldSelect
            id="currency"
            label="Currency"
            value={filters.currency}
            onChange={(v) => setFilter("currency", v)}
            options={[
              "All currencies",
              ...Array.from(new Set(properties.map((p) => p.currency))),
            ]}
          />
          <div className="od-field">
            <Label htmlFor="min-price">Min price (millions)</Label>
            <Input
              id="min-price"
              type="number"
              min="0"
              disabled={filters.currency === "All currencies"}
              value={filters.min}
              onChange={(e) => setFilter("min", e.target.value)}
              placeholder="No minimum"
            />
          </div>
          <div className="od-field">
            <Label htmlFor="max-price">Max price (millions)</Label>
            <Input
              id="max-price"
              type="number"
              min="0"
              disabled={filters.currency === "All currencies"}
              value={filters.max}
              onChange={(e) => setFilter("max", e.target.value)}
              placeholder="No maximum"
            />
          </div>
          <div className="od-field">
            <Label htmlFor="min-yield">Minimum yield (%)</Label>
            <Input
              id="min-yield"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={filters.yield}
              onChange={(e) => setFilter("yield", e.target.value)}
              placeholder="Any yield"
            />
          </div>
          <FieldSelect
            id="tenure"
            label="Tenure"
            value={filters.tenure}
            onChange={(v) => setFilter("tenure", v)}
            options={["Any tenure", "Freehold", "Leasehold"]}
          />
          <p className="filter-hint">
            Select a currency to filter by price. Values are not converted
            between currencies.
          </p>
          {filters.min &&
            filters.max &&
            Number(filters.min) > Number(filters.max) && (
              <p className="field-error">
                The maximum price must be at least the minimum price.
              </p>
            )}
        </div>
      )}
    </div>
  );
  const applied = (Object.keys(filters) as (keyof Filters)[]).filter(
    (k) => filters[k] !== emptyFilters[k] && filters[k],
  );
  return (
    <PortalContext.Provider
      value={{
        properties,
        filters,
        setFilters,
        saved,
        compared,
        view,
        setView,
        sort,
        setSort,
        setChatOpen,
        filterOpen,
        setFilterOpen,
        setAdvanced,
        setCompared,
        navigate,
        browseRegion,
        card,
        setFilter,
        filterControls,
        applied,
        results,
        isSaved,
        current,
        priorRoute,
        toggleSaved,
        toggleCompare,
        setAction,
        openProperty,
      }}
    >
      <div className="app-shell">
        <a
          className="skip-link"
          href="#main-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          Skip to content
        </a>
        <aside className="sidebar">
          <button
            className="sidebar-brand"
            onClick={() => navigate("overview")}
            aria-label="Knight Frank global overview"
          >
            <Brand />
            <span>GLOBAL INVESTMENT</span>
          </button>
          {navContent}
        </aside>
        <div className={"app-body " + (compared.length ? "has-compare" : "")}>
          <header className="topbar">
            <div className="od-row">
              <Button
                variant="ghost"
                size="icon"
                className="mobile-menu"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
              <span className="topbar-title">Global Investment Portal</span>
              <span className="topbar-divider" />
              <span className="topbar-subtitle">Private client access</span>
            </div>
            <div className="od-row">
              <span className="demo-pill">DEMONSTRATION</span>
              <Button
                variant="ghost"
                onClick={() => setChatOpen(true)}
                className="top-assistant"
              >
                <Sparkles /> <span>Ask the assistant</span>
              </Button>
            </div>
          </header>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <footer className="app-footer">
            <Brand />
            <span>Global perspective. Personal service.</span>
            <span>© {new Date().getFullYear()} · Design demonstration</span>
          </footer>
        </div>
        {compared.length > 0 && (
          <div className="comparison-tray">
            <div className="od-row">
              <Scale size={20} />
              <strong>{compared.length} of 3 selected</strong>
              <div className="tray-names">
                {compared.map((id) => (
                  <span key={id}>
                    {properties.find((p) => p.id === id)?.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="od-row">
              <Button variant="ghost" onClick={() => setCompared([])}>
                Clear
              </Button>
              <Button
                disabled={compared.length < 2}
                onClick={() => navigate("compare")}
              >
                Compare <ArrowRight />
              </Button>
            </div>
          </div>
        )}
        {toast && (
          <div className="toast-message" role="status">
            <CheckCircle2 size={18} />
            <span>{toast}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogContent className="navigation-dialog">
            <DialogHeader>
              <DialogTitle>Global Investment</DialogTitle>
              <DialogDescription>Your investor workspace</DialogDescription>
            </DialogHeader>
            {navContent}
          </DialogContent>
        </Dialog>
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="filters-dialog">
            <DialogHeader>
              <DialogTitle>Refine opportunities</DialogTitle>
              <DialogDescription>
                Filter the sample portfolio to match your criteria.
              </DialogDescription>
            </DialogHeader>
            {filterOpen && filterControls}
            <Button onClick={() => setFilterOpen(false)}>
              Show {results.length} opportunities
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFilters({ ...emptyFilters })}
            >
              Reset filters
            </Button>
          </DialogContent>
        </Dialog>
        <Assistant
          properties={properties}
          open={chatOpen}
          onOpenChange={setChatOpen}
          onOpenProperty={(p) => {
            setChatOpen(false);
            openProperty(p);
          }}
          onApply={(f) => {
            setFilters(f);
            setAdvanced(true);
            setChatOpen(false);
            navigate("opportunities");
          }}
          onCompare={(ids) => {
            setCompared(ids);
            setChatOpen(false);
            navigate("compare");
          }}
        />
        {action && (
          <ActionDialog
            initialEmail={user.email}
            action={action}
            onClose={() => setAction(null)}
          />
        )}
      </div>
    </PortalContext.Provider>
  );
}



