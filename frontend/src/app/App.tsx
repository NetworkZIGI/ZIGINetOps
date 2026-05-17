import { useEffect, useState } from 'react';

import { PacketAnalysisPage, type PacketAnalysisView } from '../features/packet-analysis/components/PacketAnalysisPage';
import { MainLayout } from '../layout/MainLayout';
import { Providers } from './providers';

export function App() {
  const [activeView, setActiveView] = useState<PacketAnalysisView>('upload');

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        [
          '.panel p',
          '.panel span',
          '.panel label',
          '.panel th',
          '.panel td',
          '.panel button',
          '.panel input',
          '.chat-panel p',
          '.chat-panel span',
          '.chat-panel button',
          '.chat-panel input',
          '.sidebar .nav-child',
          '.sidebar .nav-parent',
        ].join(','),
      ),
    );
    const measured = targets.map((el) => ({
      tag: el.tagName.toLowerCase(),
      className: el.className,
      fontSize: window.getComputedStyle(el).fontSize,
      text: (el.textContent ?? '').trim().slice(0, 60),
    }));
    const violations = measured.filter((item) => item.fontSize !== '12px');
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H1',location:'App.tsx:fontAuditEffect',message:'computed font size audit for non-title UI elements',data:{activeView,totalTargets:measured.length,violationCount:violations.length,sampleViolations:violations.slice(0,40)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [activeView]);

  return (
    <Providers>
      <MainLayout activeView={activeView} onViewChange={setActiveView}>
        <PacketAnalysisPage activeView={activeView} />
      </MainLayout>
    </Providers>
  );
}
