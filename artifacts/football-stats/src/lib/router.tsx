import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type RouterContextValue = {
  pathname: string;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, "", to);
    setPathname(to);
  }, []);

  const value = useMemo(
    () => ({ pathname, navigate }),
    [pathname, navigate],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error("useLocation must be used within a RouterProvider");
  }

  return [context.pathname, context.navigate] as const;
}

export function useNavigate() {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error("useNavigate must be used within a RouterProvider");
  }

  return context.navigate;
}
