"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

export interface SelectionEntry {
  universityId: string;
  universityName: string;
  programme?: string;
  applicationYear?: number;
}

type Action =
  | { type: "ADD"; entry: SelectionEntry }
  | { type: "REMOVE"; universityId: string }
  | {
      type: "UPDATE";
      universityId: string;
      patch: Partial<Pick<SelectionEntry, "programme" | "applicationYear">>;
    }
  | { type: "CLEAR" };

function reducer(state: SelectionEntry[], action: Action): SelectionEntry[] {
  switch (action.type) {
    case "ADD":
      if (state.some((e) => e.universityId === action.entry.universityId)) {
        return state;
      }
      return [...state, action.entry];
    case "REMOVE":
      return state.filter((e) => e.universityId !== action.universityId);
    case "UPDATE":
      return state.map((e) =>
        e.universityId === action.universityId ? { ...e, ...action.patch } : e,
      );
    case "CLEAR":
      return [];
  }
}

interface SelectionContextValue {
  entries: SelectionEntry[];
  add: (entry: SelectionEntry) => void;
  remove: (universityId: string) => void;
  update: (
    universityId: string,
    patch: Partial<Pick<SelectionEntry, "programme" | "applicationYear">>,
  ) => void;
  clear: () => void;
  isSelected: (universityId: string) => boolean;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [entries, dispatch] = useReducer(reducer, []);

  const selectedIds = useMemo(
    () => new Set(entries.map((e) => e.universityId)),
    [entries],
  );

  const add = useCallback(
    (entry: SelectionEntry) => dispatch({ type: "ADD", entry }),
    [],
  );
  const remove = useCallback(
    (universityId: string) => dispatch({ type: "REMOVE", universityId }),
    [],
  );
  const update = useCallback(
    (
      universityId: string,
      patch: Partial<Pick<SelectionEntry, "programme" | "applicationYear">>,
    ) => dispatch({ type: "UPDATE", universityId, patch }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const isSelected = useCallback(
    (universityId: string) => selectedIds.has(universityId),
    [selectedIds],
  );

  const value = useMemo(
    () => ({ entries, add, remove, update, clear, isSelected }),
    [entries, add, remove, update, clear, isSelected],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used inside SelectionProvider");
  }
  return ctx;
}
