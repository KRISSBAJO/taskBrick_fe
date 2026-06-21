"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider.");
  }

  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const close = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(options)}
        title={options?.title ?? ""}
        description={options?.description ?? ""}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        tone={options?.tone}
        onClose={() => close(false)}
        onConfirm={() => close(true)}
      />
    </ConfirmContext.Provider>
  );
}
