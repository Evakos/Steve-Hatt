"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: number;
  label: string;
  /** Shown on the right of the option, for example the estimated price. */
  hint?: string;
}

interface Props {
  value: number;
  options: SelectOption[];
  onChange: (value: number) => void;
  ariaLabel: string;
}

/**
 * A styled dropdown in place of the browser's own select, which can't be styled and looks different
 * on every device. Opens a list under the button, shows a tick against the chosen option and an
 * optional hint (such as the price) beside each one, closes on a click outside, and works from the
 * keyboard (arrow keys, Enter or Space to choose, Escape to close).
 */
export default function CustomSelect({ value, options, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    setActive(selectedIndex);
    setOpen((o) => !o);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setActive(selectedIndex);
        setOpen(true);
      } else {
        setActive((a) => Math.min(options.length - 1, a + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setActive(selectedIndex);
        setOpen(true);
      } else {
        setActive((a) => Math.max(0, a - 1));
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else toggle();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-44">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-3 border bg-card px-4 py-2.5 text-left text-sm font-medium text-navy outline-none transition-colors ${
          open ? "border-navy shadow-sm" : "border-border hover:border-navy/50 focus-visible:border-navy"
        }`}
        style={{ borderRadius: "5px" }}
      >
        <span>{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-light transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 z-30 mt-1 w-full min-w-[13rem] overflow-hidden border border-border bg-white py-1 shadow-lg"
          style={{ borderRadius: "5px" }}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-sm ${
                  i === active ? "bg-cream" : ""
                } ${isSelected ? "font-medium text-navy" : "text-foreground"}`}
              >
                <span className="flex items-center gap-2">
                  {isSelected ? <Check className="h-3.5 w-3.5 text-teal" /> : <span className="w-3.5" />}
                  {option.label}
                </span>
                {option.hint && <span className="text-text-light">{option.hint}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
