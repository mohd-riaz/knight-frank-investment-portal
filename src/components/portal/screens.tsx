"use client";
import { PropertyDetail } from "@/components/portal/parts";
import { SearchBar } from "@/components/portal/search-bar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assetClasses,
  emptyFilters,
  income,
  yieldText,
  areaText,
  money,
  regions,
  shortAsset,
} from "@/data";
import { usePortal } from "@/portal";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Copy,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Scale,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { propertyImage } from "@/lib/property-images";
import React from "react";
const regionCode: Record<string, string> = {
  Asia: "01",
  Australia: "02",
  Europe: "03",
  UK: "04",
  USA: "05",
  Africa: "06",
  "Middle East": "07",
  "Rest of the World": "08",
};
export function OverviewScreen() {
  const { properties, setFilters, setChatOpen, navigate, browseRegion, card } =
    usePortal();
  return (
    <div className="overview page-content">
      <div className="overview-lead">
        <div className="page-intro od-row">
          <div className="od-fill">
            <span className="eyebrow">A GLOBAL VIEW. YOUR PERSPECTIVE.</span>
            <h1>A world of opportunity.</h1>
            <p className="muted">
              Discover the next chapter of your investment portfolio.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ ...emptyFilters });
              navigate("opportunities");
            }}
          >
            Explore all opportunities <ArrowUpRight />
          </Button>
        </div>
        <section className="overview-hero">
          <div className="overview-hero-content">
            <span className="eyebrow light">CONNECTED ACROSS MARKETS</span>
            <h2>
              Local knowledge.
              <br />
              Global possibilities.
            </h2>
            <p>
              Find the markets and assets that
              <br className="desktop-break" /> match your investment ambitions.
            </p>
            <Button variant="secondary" onClick={() => browseRegion("Europe")}>
              Explore Europe <ArrowUpRight />
            </Button>
            <div className="hero-caption">
              <MapPin size={14} /> London, United Kingdom
            </div>
          </div>
          <div className="hero-fact">
            <span className="eyebrow light">YOUR INVESTMENT UNIVERSE</span>
            <div className="hero-fact-grid">
              <div className="od-stat">
                <strong>{properties.length}</strong>
                <span>Opportunities</span>
              </div>
              <div className="od-stat">
                <strong>{regions.length}</strong>
                <span>Global regions</span>
              </div>
              <div className="od-stat">
                <strong>{assetClasses.length - 1}</strong>
                <span>Asset classes</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="region-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR MARKET</span>
            <h2>Where will you invest next?</h2>
          </div>
          <span className="muted">Explore by region</span>
        </div>
        <div className="region-grid">
          {regions.map((r) => (
            <button
              className="region-tile"
              key={r}
              onClick={() => browseRegion(r)}
            >
              <span className="region-number">{regionCode[r]}</span>
              <div className="od-field od-fill">
                <strong>{r}</strong>
                <span>
                  {properties.filter((p) => p.region === r).length}{" "}
                  {properties.filter((p) => p.region === r).length === 1
                    ? "opportunity"
                    : "opportunities"}
                </span>
              </div>
              <ArrowUpRight size={20} />
            </button>
          ))}
        </div>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACROSS OUR NETWORK</span>
            <h2>Opportunities in focus</h2>
          </div>
          <Button
            variant="link"
            onClick={() => {
              setFilters({ ...emptyFilters });
              navigate("opportunities");
            }}
          >
            View all opportunities <ArrowRight />
          </Button>
        </div>
        <div className="property-grid">{properties.slice(0, 3).map(card)}</div>
      </section>
      <section className="ask-banner">
        <div className="od-row">
          <div className="ask-banner-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h2>Your criteria. A clearer starting point.</h2>
            <p>Find opportunities in your own words.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setChatOpen(true)}>
          Start a conversation <ArrowUpRight />
        </Button>
      </section>
    </div>
  );
}
export function ListingsScreen() {
  const {
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
    navigate,
    card,
    setFilter,
    filterControls,
    applied,
    results,
    isSaved,
    toggleSaved,
    toggleCompare,
    openProperty,
  } = usePortal();
  return (
    <div className="page-content listings">
      <div className="page-intro od-row">
        <div className="od-fill">
          <span className="eyebrow">
            {isSaved
              ? "YOUR CONSIDERED SELECTION"
              : "GLOBAL INVESTMENT OPPORTUNITIES"}
          </span>
          <h1>
            {isSaved
              ? "Your shortlist."
              : filters.region.length === 1
                ? `${filters.region[0]} opportunities.`
                : "Find your next investment."}
          </h1>
          <p className="muted">
            {isSaved
              ? "The opportunities you want to keep in view."
              : "A considered selection. A world of possibilities."}
          </p>
        </div>
        <Button variant="outline" onClick={() => setChatOpen(true)}>
          <Sparkles /> Search with the assistant
        </Button>
      </div>
      <SearchBar
        label="Search opportunities"
        placeholder="Search by property, city or country"
        value={filters.query}
        onChange={(value) => setFilter("query", value)}
      >
        <Button
          variant="outline"
          className="mobile-filter"
          onClick={() => setFilterOpen(true)}
        >
          <SlidersHorizontal /> Filters
        </Button>
      </SearchBar>
      <div className="desktop-filters">{!filterOpen && filterControls}</div>
      {applied.length > 0 && (
        <div className="applied-filters od-cluster">
          {applied.flatMap((k) => {
            const selected = filters[k];
            return (Array.isArray(selected) ? selected : [selected]).map(
              (value) => (
                <button
                  key={`${k}:${value}`}
                  className="filter-chip"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      [k]: Array.isArray(f[k])
                        ? f[k].filter((item) => item !== value)
                        : emptyFilters[k],
                      ...(k === "currency" ? { min: "", max: "" } : {}),
                    }))
                  }
                  aria-label={`Remove ${value} ${k} filter`}
                >
                  <span>
                    {k === "min"
                      ? "Min: "
                      : k === "max"
                        ? "Max: "
                        : k === "yield"
                          ? "Yield ≥ "
                          : ""}
                    {k === "asset" ? shortAsset(value) : value}
                    {k === "yield"
                      ? "%"
                      : k === "min" || k === "max"
                        ? "m"
                        : ""}
                  </span>
                  <X size={13} />
                </button>
              ),
            );
          })}
          <Button
            variant="link"
            onClick={() => setFilters({ ...emptyFilters })}
          >
            Clear all
          </Button>
        </div>
      )}
      <div className="results-toolbar">
        <div className="od-row">
          <strong>
            {results.length}{" "}
            {results.length === 1 ? "opportunity" : "opportunities"}
          </strong>
        </div>
        <div className="od-row">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              className="sort-select"
              aria-label="Sort opportunities"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Recommended", "Highest yield", "Name A–Z"].map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="view-switch" aria-label="Results view">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Card view"
              aria-pressed={view === "grid"}
              className={view === "grid" ? "selected" : ""}
              onClick={() => setView("grid")}
            >
              <LayoutGrid />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Table view"
              aria-pressed={view === "table"}
              className={view === "table" ? "selected" : ""}
              onClick={() => setView("table")}
            >
              <List />
            </Button>
          </div>
        </div>
      </div>
      {results.length ? (
        view === "grid" ? (
          <div className="property-grid">{results.map(card)}</div>
        ) : (
          <div className="opportunity-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Asset class</TableHead>
                  <TableHead>Asking price</TableHead>
                  <TableHead>Net yield</TableHead>
                  <TableHead>Tenure</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <button
                        className="table-property"
                        onClick={() => openProperty(p)}
                      >
                        <strong>{p.name}</strong>
                        <span>
                          {p.city}, {p.country}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>{shortAsset(p.asset)}</TableCell>
                    <TableCell className="od-nowrap">{money(p)}</TableCell>
                    <TableCell className="od-nowrap">{yieldText(p)}</TableCell>
                    <TableCell>{p.tenure}</TableCell>
                    <TableCell>
                      <div className="od-row">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            saved.includes(p.id)
                              ? `Unsave ${p.name}`
                              : `Save ${p.name}`
                          }
                          onClick={() => toggleSaved(p)}
                        >
                          <Bookmark
                            fill={
                              saved.includes(p.id) ? "currentColor" : "none"
                            }
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Compare ${p.name}`}
                          aria-pressed={compared.includes(p.id)}
                          onClick={() => toggleCompare(p)}
                        >
                          {compared.includes(p.id) ? <Check /> : <Plus />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            {isSaved && !saved.length ? (
              <Bookmark size={28} />
            ) : (
              <Search size={28} />
            )}
          </div>
          <h2>
            {isSaved && !saved.length
              ? "Your next opportunity starts here."
              : "No opportunities match these criteria."}
          </h2>
          <p>
            {isSaved && !saved.length
              ? "Save properties as you explore to build a considered shortlist."
              : "Try a different market or broaden your filters to see more opportunities."}
          </p>
          <Button
            onClick={() => {
              setFilters({ ...emptyFilters });
              if (isSaved && !saved.length) navigate("opportunities");
            }}
          >
            {isSaved && !saved.length
              ? "Explore opportunities"
              : "Reset filters"}
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}
export function DetailScreen() {
  const {
    saved,
    pendingAccess,
    compared,
    navigate,
    current,
    priorRoute,
    toggleSaved,
    toggleCompare,
    setAction,
  } = usePortal();
  if (!current) return null;
  return (
    <PropertyDetail
      key={current.id}
      p={current}
      onBack={() => navigate(priorRoute.current)}
      saved={saved.includes(current.id)}
      accessPending={pendingAccess.includes(current.id)}
      compared={compared.includes(current.id)}
      onSave={() => toggleSaved(current)}
      onCompare={() => toggleCompare(current)}
      onAction={(kind) => setAction({ kind, property: current })}
    />
  );
}
export function ComparisonScreen() {
  const {
    properties,
    compared,
    setCompared,
    copyComparisonLink,
    navigate,
    openProperty,
  } = usePortal();
  return (
    <div className="page-content compare-page">
      <Button
        variant="link"
        className="back-button"
        onClick={() => navigate("opportunities")}
      >
        <ArrowLeft /> Back to opportunities
      </Button>
      <div className="page-intro od-row">
        <div className="od-fill">
          <span className="eyebrow">A CLEARER PERSPECTIVE</span>
          <h1>Compare your opportunities.</h1>
          <p className="muted">
            View the details that matter, side by side. Currencies are shown as
            quoted.
          </p>
        </div>
        {compared.length >= 2 && (
          <Button variant="outline" onClick={() => void copyComparisonLink()}>
            <Copy /> Copy link
          </Button>
        )}
      </div>
      {compared.length >= 2 ? (
        <div className="comparison-scroll">
          <div
            className="comparison-grid"
            style={
              {
                "--comparison-cols": compared.length,
              } as React.CSSProperties
            }
          >
            {compared.map((id) => {
              const p = properties.find((p) => p.id === id)!;
              return (
                <article key={id} className="compare-column">
                  <div className="compare-image">
                    <Image
                      className="od-media"
                      {...propertyImage(p)}
                      alt={p.name}
                    />
                    <Button
                      className="compare-remove"
                      variant="secondary"
                      size="icon"
                      aria-label={`Remove ${p.name} from comparison`}
                      onClick={() =>
                        setCompared((v) => v.filter((x) => x !== id))
                      }
                    >
                      <X />
                    </Button>
                  </div>
                  <h2>{p.name}</h2>
                  <p>
                    {p.city}, {p.country}
                  </p>
                  <dl>
                    {[
                      ["Asset class", shortAsset(p.asset)],
                      ["Asking price", money(p)],
                      ["Net yield", yieldText(p)],
                      [p.incomeType || "Reported annual income", income(p)],
                      ["Floor area", areaText(p)],
                      ["Tenure", p.tenure],
                      ["Region", p.region],
                    ].map(([k, v]) => (
                      <div key={k} className="od-field">
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <Button variant="outline" onClick={() => openProperty(p)}>
                    View opportunity <ArrowUpRight />
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Scale size={32} />
          <h2>Select at least two opportunities.</h2>
          <p>Add up to three properties to compare their investment metrics.</p>
          <Button onClick={() => navigate("opportunities")}>
            Browse opportunities
          </Button>
        </div>
      )}
    </div>
  );
}
