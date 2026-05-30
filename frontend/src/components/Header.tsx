import { ThemeToggle } from "./ThemeToggle";

interface Props {
  stats: { records: number; zones: number; servers: number };
}

export function Header({ stats }: Props) {
  return (
    <header className="header">
      <div className="header-row">
        <div>
          <div className="header-brand">
            <span className="header-kb">KB</span>
            <h1>DNS Resolution Simulator</h1>
          </div>
          <p>
            System design portfolio piece — hierarchical DNS lookup with live query-path
            visualization. By{" "}
            <a
              className="header-portfolio-link"
              href="https://kaustuvbasak.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kaustuv Basak
            </a>
            .
          </p>
        </div>
        <div className="header-actions">
          <div className="header-stats">
            <div className="stat">
              <span className="stat-value">{stats.records}</span>
              <span className="stat-label">Records</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.zones}</span>
              <span className="stat-label">Zones</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.servers}</span>
              <span className="stat-label">Servers</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
