import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { getObfuscationMap } from '../api';
import { FileMetadata } from '../types';

type Props = {
  file: FileMetadata;
  onClose: () => void;
};

export function ObfuscationMappingModal({ file, onClose }: Props) {
  const [copiedMessageVisible, setCopiedMessageVisible] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ['obfuscation-map', file.id],
    queryFn: () => getObfuscationMap(file.id),
  });

  const copy = async () => {
    const tsv = ['Original IP\tObfuscated IP\tVersion']
      .concat(data.map((row) => `${row.original_ip}\t${row.obfuscated_ip}\tIPv${row.ip_version}`))
      .join('\n');
    await navigator.clipboard.writeText(tsv);
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H1',location:'ObfuscationMappingModal.tsx:copy',message:'copy button clicked',data:{rowCount:data.length,tsvLength:tsv.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (copiedTimerRef.current) {
      window.clearTimeout(copiedTimerRef.current);
    }
    setCopiedMessageVisible(true);
    copiedTimerRef.current = window.setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H2',location:'ObfuscationMappingModal.tsx:copyTimeout',message:'copy message auto-hidden',data:{delayMs:5000},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setCopiedMessageVisible(false);
    }, 5000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>정보 변조 매핑: {file.filename}</h3>
        </div>
        {isLoading ? (
          <p>매핑 정보를 불러오는 중입니다.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>원본 IP</th>
                    <th>변조 IP</th>
                    <th>버전</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={`${row.original_ip}-${row.obfuscated_ip}`}>
                      <td>{row.original_ip}</td>
                      <td>{row.obfuscated_ip}</td>
                      <td>IPv{row.ip_version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions-right">
              <div className="copy-feedback-wrap">
                <button className="primary-button" onClick={copy} type="button">클립보드 복사</button>
                {copiedMessageVisible && (
                  <p className="copy-feedback-message">클립보드로 복사되었습니다</p>
                )}
              </div>
              <button className="secondary-button" onClick={onClose} type="button">닫기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
