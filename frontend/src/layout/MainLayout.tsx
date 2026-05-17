import { PropsWithChildren } from 'react';

import type { PacketAnalysisView } from '../features/packet-analysis/components/PacketAnalysisPage';
import { Sidebar } from './Sidebar';

type Props = PropsWithChildren<{
  activeView: PacketAnalysisView;
  onViewChange: (view: PacketAnalysisView) => void;
}>;

export function MainLayout({ children, activeView, onViewChange }: Props) {
  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      <div className="content-shell">
        <header className="topbar">
          <div>
            <span>Network Operations Portal</span>
            <strong>패킷 분석</strong>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
