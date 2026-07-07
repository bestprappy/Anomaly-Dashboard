"use client";

import {
  KeyboardEvent,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
} from "react";

/**
 * Compound Tabs primitive (controlled).
 *
 * <Tabs value={tab} onValueChange={setTab}>
 *   <Tabs.List aria-label="...">
 *     <Tabs.Trigger value="a">A</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Panel value="a">...</Tabs.Panel>
 * </Tabs>
 *
 * Implements the WAI-ARIA tabs pattern: roving tabindex, arrow-key /
 * Home / End navigation with selection-on-focus.
 */

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(
      `<${component}> must be rendered inside <Tabs>. Wrap your tab markup in the <Tabs> provider.`
    );
  }
  return ctx;
}

const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`;
const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`;

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

function TabsRoot({ value, onValueChange, children, className }: TabsProps) {
  const baseId = useId();
  const ctx = useMemo<TabsContextValue>(
    () => ({ value, setValue: onValueChange, baseId }),
    [value, onValueChange, baseId]
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  "aria-label": string;
  className?: string;
}

function TabsList({ children, "aria-label": ariaLabel, className }: TabsListProps) {
  useTabsContext("Tabs.List");
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list) return;

    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')
    );
    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (tabs.length === 0) return;

    let nextIndex: number | null = null;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = currentIndex < 0 ? 0 : (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = tabs[nextIndex];
    next.focus();
    next.click(); // selection follows focus
  }, []);

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1"
      }
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

function TabsTrigger({ value, children, disabled }: TabsTriggerProps) {
  const { value: selected, setValue, baseId } = useTabsContext("Tabs.Trigger");
  const isSelected = selected === value;

  return (
    <button
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={isSelected}
      aria-controls={panelId(baseId, value)}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={`rounded px-4 py-2 text-sm font-medium transition-colors duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${
        isSelected
          ? "bg-card text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

interface TabsPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { value: selected, baseId } = useTabsContext("Tabs.Panel");
  const isSelected = selected === value;

  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      hidden={!isSelected}
      tabIndex={0}
      className={className}
    >
      {isSelected ? children : null}
    </div>
  );
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Panel: TabsPanel,
});
