import { DumpAnalyzePanel } from './DumpAnalyzePanel';
import { FileUploadPanel } from './FileUploadPanel';
import { PcapAnalyzePanel } from './PcapAnalyzePanel';

export type PacketAnalysisView = 'upload' | 'pcap' | 'dump';

const pageMeta: Record<PacketAnalysisView, { eyebrow: string; title: string; description: string }> = {
  upload: {
    eyebrow: 'Packet Analysis',
    title: '파일 업로드',
    description: 'pcap 파일을 업로드하고 Description, 다운로드, 삭제, 정보 변조를 관리합니다.',
  },
  pcap: {
    eyebrow: 'Packet Analysis',
    title: 'pcap 파일 분석',
    description: '업로드된 pcap 파일을 선택하고 IP 조건과 추가 메시지를 기반으로 분석합니다.',
  },
  dump: {
    eyebrow: 'Packet Analysis',
    title: 'dump 내용 분석',
    description: 'tcpdump 텍스트를 직접 입력하고 LLM 기반 분석 및 후속 질의를 진행합니다.',
  },
};

export function PacketAnalysisPage({ activeView }: { activeView: PacketAnalysisView }) {
  const meta = pageMeta[activeView];
  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
      </div>
      {activeView === 'upload' && <FileUploadPanel />}
      {activeView === 'pcap' && <PcapAnalyzePanel />}
      {activeView === 'dump' && <DumpAnalyzePanel />}
    </div>
  );
}
