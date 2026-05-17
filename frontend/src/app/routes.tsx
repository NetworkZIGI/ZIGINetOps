import type { PacketAnalysisView } from '../features/packet-analysis/components/PacketAnalysisPage';

export const packetAnalysisSubmenus: { id: PacketAnalysisView; label: string }[] = [
  {
    id: 'upload',
    label: '파일 업로드',
  },
  {
    id: 'pcap',
    label: 'pcap 파일 분석',
  },
  {
    id: 'dump',
    label: 'dump 내용 분석',
  },
] as const;

export const routes = [
  {
    id: 'packet-analysis',
    label: '패킷 분석',
    submenus: packetAnalysisSubmenus,
  },
] as const;
