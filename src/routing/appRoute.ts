import { useCallback, useEffect, useState } from 'react';

export type AppRoute = 'studio' | 'lab';

export const ROUTE_PATHS: Record<AppRoute, string> = {
  studio: '/studio',
  lab: '/lab',
};

/**
 * Resuelve la ruta lógica a partir de `location.pathname`.
 * - `/studio` y subrutas -> Bi-Tech IoT Studio
 * - `/lab` y subrutas -> Smart Garden Lab
 * - `/` o rutas desconocidas -> redirigen a `/studio`
 */
export function resolveRoute(pathname: string): {
  route: AppRoute;
  needsRedirect: boolean;
} {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/studio' || normalized.startsWith('/studio/')) {
    return { route: 'studio', needsRedirect: false };
  }
  if (normalized === '/lab' || normalized.startsWith('/lab/')) {
    return { route: 'lab', needsRedirect: false };
  }
  return { route: 'studio', needsRedirect: true };
}

/**
 * Router mínimo basado en History API (sin dependencias adicionales).
 * Firebase Hosting ya reescribe `**` a `/index.html`, por lo que los accesos
 * directos a `/studio` y `/lab` funcionan en el sitio publicado.
 */
export function useAppRoute(): {
  route: AppRoute;
  navigate: (route: AppRoute) => void;
} {
  const [route, setRoute] = useState<AppRoute>(() => {
    const resolved = resolveRoute(window.location.pathname);
    if (resolved.needsRedirect) {
      window.history.replaceState(null, '', ROUTE_PATHS[resolved.route]);
    }
    return resolved.route;
  });

  useEffect(() => {
    const onPopState = () => {
      const resolved = resolveRoute(window.location.pathname);
      if (resolved.needsRedirect) {
        window.history.replaceState(null, '', ROUTE_PATHS[resolved.route]);
      }
      setRoute(resolved.route);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next: AppRoute) => {
    if (window.location.pathname !== ROUTE_PATHS[next]) {
      window.history.pushState(null, '', ROUTE_PATHS[next]);
    }
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  return { route, navigate };
}
