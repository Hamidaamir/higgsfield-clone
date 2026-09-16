"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { LogoMark } from "@/components/layout/logo";
import { SettingChip } from "@/components/generator/setting-chip";
import { Badge, navBadgeVariant } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

interface ModelPickerProps {
  models: ModelSpec[];
  value: ModelSpec | undefined;
  onChange: (model: ModelSpec) => void;
  disabled?: boolean;
}

function badgeLabel(badge: string | null): "New" | "Free" | "TOP" | null {
  if (badge === "NEW") return "New";
  if (badge === "TOP") return "TOP";
  if (badge === "FREE") return "Free";
  return null;
}

/** Searchable model list (name, description, badge, cost) rendered from the server registry. */
export function ModelPicker({ models, value, onChange, disabled }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? models.filter((m) => `${m.name} ${m.description} ${m.tags.join(" ")}`.toLowerCase().includes(q)) : models;
  }, [models, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SettingChip
          aria-label="Model"
          icon={<LogoMark className="size-4 text-accent" />}
          label={value?.name ?? "Choose model"}
          expandable
          disabled={disabled}
          className="max-w-52"
        />
      </PopoverTrigger>
      <PopoverContent className="w-[380px] max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b border-border p-2">
          <label className="flex h-9 items-center gap-2 rounded-lg bg-surface px-2.5 text-sm text-text-secondary">
            <Search className="size-4" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models"
              aria-label="Search models"
              className="w-full bg-transparent text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>
        </div>
        <ul role="listbox" aria-label="Models" className="max-h-80 overflow-y-auto p-1.5 scrollbar-thin">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-text-secondary">No models match “{query}”.</li>
          ) : null}
          {filtered.map((model) => {
            const selected = model.id === value?.id;
            const badge = badgeLabel(model.badge);
            return (
              <li key={model.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(model);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-muted",
                    selected && "bg-surface-muted",
                  )}
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-primary">
                    <LogoMark className="size-5" />
                    {badge ? (
                      <Badge variant={navBadgeVariant(badge)} className="absolute -left-1 -top-1.5">
                        {badge}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {model.name}
                      <span className="text-[11px] font-medium text-text-muted">✦ {model.credit_cost}</span>
                    </span>
                    <span className="block truncate text-[13px] text-text-secondary">{model.description}</span>
                  </span>
                  {selected ? <Check className="size-4 shrink-0 text-accent" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
