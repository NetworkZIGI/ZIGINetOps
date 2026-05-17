import type { PacketAnalysisView } from '../features/packet-analysis/components/PacketAnalysisPage';
import { routes } from '../app/routes';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  activeView: PacketAnalysisView;
  onViewChange: (view: PacketAnalysisView) => void;
};

export function Sidebar({ activeView, onViewChange }: Props) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark">Z</div>
          <div>
            <h1>ZIGI NetOps</h1>
            <p>Detect. Triage. Resolve.</p>
          </div>
        </div>
        <nav className="side-nav">
          {routes.map((route) => (
            <div className="nav-group" key={route.id}>
              <button className="nav-parent active" type="button">
                <span className="nav-icon">◎</span>
                {route.label}
              </button>
              <div className="nav-children">
                {route.submenus.map((submenu) => (
                  <button
                    className={activeView === submenu.id ? 'nav-child active' : 'nav-child'}
                    key={submenu.id}
                    onClick={() => onViewChange(submenu.id)}
                    type="button"
                  >
                    {submenu.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <ThemeToggle />
        <div className="settings-link">Settings</div>
      </div>
    </aside>
  );
}
