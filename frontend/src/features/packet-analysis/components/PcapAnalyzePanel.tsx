import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { isValidIp } from '../../../shared/validation/ip';
import { analyzePcap, listFiles } from '../api';
import { ChatMessage } from '../types';
import { ChatPanel } from './ChatPanel';
import { MessageModal } from './MessageModal';

const startMessage = (): ChatMessage => ({
  id: crypto.randomUUID(),
  session_id: 'pending',
  role: 'system',
  content: '분석 시작',
  created_at: new Date().toISOString(),
});

export function PcapAnalyzePanel() {
  const { data = [] } = useQuery({ queryKey: ['files'], queryFn: listFiles });
  const selectableFiles = data.filter((file) => !file.is_obfuscated && !file.filename.startsWith('modi_'));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sourceIp, setSourceIp] = useState('');
  const [destinationIp, setDestinationIp] = useState('');
  const [extraMessage, setExtraMessage] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [panelNotice, setPanelNotice] = useState<string | null>(null);
  const invalidSource = !isValidIp(sourceIp);
  const invalidDestination = !isValidIp(destinationIp);
  const selectedFiles = data.filter((file) => selectedIds.includes(file.id));

  const selectFileFromDropdown = (fileId: string) => {
    if (!fileId) {
      return;
    }
    setSelectedIds((current) => {
      if (current.includes(fileId)) {
        return current;
      }
      return [...current, fileId];
    });
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H1',location:'PcapAnalyzePanel.tsx:selectFileFromDropdown',message:'file selected and auto-added',data:{fileId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  };

  const removeSelectedFile = (fileId: string) => {
    setSelectedIds((current) => current.filter((id) => id !== fileId));
  };

  const start = async () => {
    if (selectedIds.length === 0) {
      setPanelNotice('분석할 파일을 먼저 선택하세요.');
      return;
    }
    if (invalidSource || invalidDestination) {
      setPanelNotice('IP 주소 형식을 확인하세요.');
      return;
    }
    setPanelNotice(null);
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H2',location:'PcapAnalyzePanel.tsx:start',message:'analysis start clicked',data:{selectedIds,sourceIp,destinationIp},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setMessages([startMessage()]);
    const response = await analyzePcap({
      file_ids: selectedIds,
      source_ip: sourceIp || undefined,
      destination_ip: destinationIp || undefined,
      extra_message: extraMessage || undefined,
    });
    setSessionId(response.session_id);
    setMessages([startMessage(), ...response.messages]);
  };

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'post-fix',hypothesisId:'H3',location:'PcapAnalyzePanel.tsx:selectableFilesEffect',message:'pcap dropdown filtering result',data:{allFiles:data.map((file)=>({id:file.id,filename:file.filename,isObfuscated:file.is_obfuscated})),selectableFiles:selectableFiles.map((file)=>({id:file.id,filename:file.filename,isObfuscated:file.is_obfuscated}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [data, selectableFiles]);

  useEffect(() => {
    const fileLabel = document.querySelector<HTMLElement>('.pcap-field-label');
    const sourceLabel = document.querySelector<HTMLElement>('.pcap-ip-inline-field > span');
    const destinationLabel = document.querySelectorAll<HTMLElement>('.pcap-ip-inline-field > span')[1];
    const analyzeButton = document.querySelector<HTMLElement>('.pcap-ip-inline-row .primary-button');
    if (!fileLabel || !sourceLabel || !destinationLabel || !analyzeButton) {
      return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H4',location:'PcapAnalyzePanel.tsx:fontMeasureEffect',message:'pcap labels and analyze button font metrics',data:{fileLabelFont:window.getComputedStyle(fileLabel).fontSize,sourceLabelFont:window.getComputedStyle(sourceLabel).fontSize,destinationLabelFont:window.getComputedStyle(destinationLabel).fontSize,analyzeButtonFont:window.getComputedStyle(analyzeButton).fontSize,analyzeButtonWhiteSpace:window.getComputedStyle(analyzeButton).whiteSpace},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [selectedIds, sourceIp, destinationIp, panelNotice, messages.length]);

  return (
    <section className="panel">
      <div className="pcap-analyze-layout">
        <label className="pcap-field-label" htmlFor="pcap-file-select">분석 파일 선택</label>
        <div className="pcap-select-row">
          <select
            id="pcap-file-select"
            onChange={(event) => {
              selectFileFromDropdown(event.currentTarget.value);
              event.currentTarget.value = '';
            }}
            defaultValue=""
          >
            <option value="">pcap 파일을 선택하세요</option>
            {selectableFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.filename}
              </option>
            ))}
          </select>
          <button className="secondary-button" onClick={() => setShowMessageModal(true)} type="button">
            ✍️ 메시지 입력
          </button>
        </div>

        <div className="selected-file-summary">
          {selectedFiles.length === 0 ? (
            <span>선택된 파일이 없습니다.</span>
          ) : (
            selectedFiles.map((file) => (
              <div className="selected-file-chip" key={file.id}>
                <span>{file.filename}</span>
                <button onClick={() => removeSelectedFile(file.id)} type="button">
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pcap-ip-inline-row">
          <IpInlineInput
            error={invalidSource}
            label="출발지 IP"
            onChange={setSourceIp}
            placeholder="예: 10.0.0.1"
            value={sourceIp}
          />
          <IpInlineInput
            error={invalidDestination}
            label="목적지 IP"
            onChange={setDestinationIp}
            placeholder="예: 10.0.0.2"
            value={destinationIp}
          />
          <button className="primary-button" onClick={start} type="button">🚀 분석 시작</button>
        </div>

        {panelNotice && <div className="status-banner error">{panelNotice}</div>}
      </div>
      <ChatPanel
        messages={messages}
        onMessagesChange={(next, nextSessionId) => {
          setMessages(next);
          setSessionId(nextSessionId);
        }}
        sessionId={sessionId}
      />
      {showMessageModal && (
        <MessageModal
          initialValue={extraMessage}
          onCancel={() => setShowMessageModal(false)}
          onSave={(message) => {
            setExtraMessage(message);
            setShowMessageModal(false);
          }}
          title="추가 메시지 입력"
        />
      )}
    </section>
  );
}

function IpInlineInput({
  label,
  value,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  error: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="pcap-ip-inline-field">
      <span>{label}</span>
      <div>
        <input
        className={error ? 'input-error' : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        value={value}
      />
        {error && <span className="field-error">IP 형식이 올바르지 않습니다.</span>}
      </div>
    </label>
  );
}
