import { useState } from 'react';

import { isValidIp } from '../../../shared/validation/ip';
import { analyzeDump } from '../api';
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

export function DumpAnalyzePanel() {
  const [dumpText, setDumpText] = useState('');
  const [sourceIp, setSourceIp] = useState('');
  const [destinationIp, setDestinationIp] = useState('');
  const [extraMessage, setExtraMessage] = useState('');
  const [modal, setModal] = useState<'dump' | 'message' | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const invalidSource = !isValidIp(sourceIp);
  const invalidDestination = !isValidIp(destinationIp);

  const start = async () => {
    if (!dumpText.trim() || invalidSource || invalidDestination) {
      return;
    }
    setMessages([startMessage()]);
    const response = await analyzeDump({
      dump_text: dumpText,
      source_ip: sourceIp || undefined,
      destination_ip: destinationIp || undefined,
      extra_message: extraMessage || undefined,
    });
    setSessionId(response.session_id);
    setMessages([startMessage(), ...response.messages]);
  };

  return (
    <section className="panel">
      <div className="form-stack">
        <div className="toolbar">
          <button className="secondary-button" onClick={() => setModal('dump')} type="button">
            tcpdump 내용 입력
          </button>
          <button className="secondary-button" onClick={() => setModal('message')} type="button">
            메시지 입력
          </button>
        </div>
        <IpInput error={invalidSource} label="Source IP" onChange={setSourceIp} value={sourceIp} />
        <IpInput
          error={invalidDestination}
          label="Destination IP"
          onChange={setDestinationIp}
          value={destinationIp}
        />
        <button className="primary-button" onClick={start} type="button">분석 시작</button>
      </div>
      <ChatPanel
        messages={messages}
        onMessagesChange={(next, nextSessionId) => {
          setMessages(next);
          setSessionId(nextSessionId);
        }}
        sessionId={sessionId}
      />
      {modal === 'dump' && (
        <MessageModal
          initialValue={dumpText}
          onCancel={() => setModal(null)}
          onSave={(value) => {
            setDumpText(value);
            setModal(null);
          }}
          title="tcpdump 내용 입력"
        />
      )}
      {modal === 'message' && (
        <MessageModal
          initialValue={extraMessage}
          onCancel={() => setModal(null)}
          onSave={(value) => {
            setExtraMessage(value);
            setModal(null);
          }}
          title="추가 메시지 입력"
        />
      )}
    </section>
  );
}

function IpInput({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        className={error ? 'input-error' : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="IPv4 또는 IPv6"
        value={value}
      />
      {error && <span className="field-error">IP 형식이 올바르지 않습니다.</span>}
    </label>
  );
}
