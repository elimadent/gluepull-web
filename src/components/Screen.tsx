import { ReactNode } from 'react';

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Screen({
  title,
  subtitle,
  children,
  onRefresh,
  refreshing,
}: ScreenProps) {
  return (
    <main className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{title}</h1>
        {subtitle ? <p className="screen-subtitle">{subtitle}</p> : null}
        {onRefresh ? (
          <button
            type="button"
            className="screen-refresh"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <span aria-hidden>{refreshing ? '⟳' : '↻'}</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        ) : null}
      </header>
      {children}
    </main>
  );
}
