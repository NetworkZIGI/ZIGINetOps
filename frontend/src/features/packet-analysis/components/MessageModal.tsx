import { useState } from 'react';

type Props = {
  initialValue: string;
  title: string;
  onCancel: () => void;
  onSave: (message: string) => void;
};

export function MessageModal({ initialValue, title, onCancel, onSave }: Props) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <textarea
          onChange={(event) => setValue(event.currentTarget.value)}
          rows={8}
          value={value}
        />
        <div className="toolbar right">
          <button className="secondary-button" onClick={() => setValue('')} type="button">초기화</button>
          <button className="secondary-button" onClick={onCancel} type="button">취소</button>
          <button className="primary-button" onClick={() => onSave(value)} type="button">저장</button>
        </div>
      </div>
    </div>
  );
}
