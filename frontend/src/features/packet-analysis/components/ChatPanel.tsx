import { FormEvent, useEffect, useState } from 'react';

import { followUp } from '../api';
import { ChatMessage } from '../types';

type Props = {
  sessionId?: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[], sessionId?: string) => void;
};

export function ChatPanel({ sessionId, messages, onMessagesChange }: Props) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const chatTitle = document.querySelector<HTMLElement>('section.chat-panel h3');
    const sendButton = document.querySelector<HTMLElement>('section.chat-panel .chat-input .primary-button');
    if (!chatTitle || !sendButton) {
      return;
    }
    const buttonRect = sendButton.getBoundingClientRect();
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H5',location:'ChatPanel.tsx:fontMeasureEffect',message:'chat title and send button metrics',data:{chatTitleFont:window.getComputedStyle(chatTitle).fontSize,sendButtonFont:window.getComputedStyle(sendButton).fontSize,sendButtonWidth:buttonRect.width,sendButtonHeight:buttonRect.height,sendButtonWhiteSpace:window.getComputedStyle(sendButton).whiteSpace,sendButtonText:(sendButton.textContent ?? '').trim()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [messages.length, sessionId, isSending, input]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!sessionId || !input.trim()) {
      return;
    }
    setIsSending(true);
    try {
      const response = await followUp(sessionId, input);
      onMessagesChange(response.messages, response.session_id);
      setInput('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="chat-panel">
      <h3>분석 채팅</h3>
      <div className="chat-messages">
        {messages.map((message) => (
          <div className={`chat-message ${message.role}`} key={message.id}>
            <strong>{message.role}</strong>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={submit}>
        <input
          disabled={!sessionId || isSending}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder={sessionId ? '후속 질문을 입력하세요.' : '분석을 먼저 시작하세요.'}
          value={input}
        />
        <button className="primary-button" disabled={!sessionId || isSending} type="submit">
          전송
        </button>
      </form>
    </section>
  );
}
