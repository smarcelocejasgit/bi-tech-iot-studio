import React from 'react';
import { ArrowLeft, ArrowRight, FlaskConical, Code2 } from 'lucide-react';
import { AppRoute, ROUTE_PATHS } from '../routing/appRoute';

interface GlobalNavProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const GlobalNav: React.FC<GlobalNavProps> = ({ route, onNavigate }) => {
  const link = (target: AppRoute, label: string, icon: React.ReactNode) => {
    const isActive = route === target;
    return (
      <a
        href={ROUTE_PATHS[target]}
        data-testid={`global-nav-${target}`}
        aria-current={isActive ? 'page' : undefined}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(target);
        }}
        className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
          isActive
            ? 'bg-white text-slate-900 shadow-2xs'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  };

  return (
    <nav
      data-testid="global-nav"
      aria-label="Entornos Bi-Tech"
      className="w-full bg-slate-900 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2"
    >
      <div className="inline-flex items-center gap-0.5 rounded-lg bg-slate-800 p-0.5">
        {link('studio', 'IoT Studio', <Code2 className="w-3.5 h-3.5" />)}
        {link(
          'lab',
          'Smart Garden Lab',
          <FlaskConical className="w-3.5 h-3.5" />
        )}
      </div>

      {route === 'studio' ? (
        <a
          href={ROUTE_PATHS.lab}
          data-testid="open-lab-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('lab');
          }}
          className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
        >
          <span>Abrir Smart Garden Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      ) : (
        <a
          href={ROUTE_PATHS.studio}
          data-testid="back-to-studio-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('studio');
          }}
          className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a IoT Studio</span>
        </a>
      )}
    </nav>
  );
};
