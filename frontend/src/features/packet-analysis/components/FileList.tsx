import { fileDownloadUrl } from '../../../shared/api/client';
import { FileMetadata } from '../types';

type Props = {
  files: FileMetadata[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDescriptionChange: (fileId: string, description: string) => void;
  onOpenMapping: (file: FileMetadata) => void;
  onDeleteSingle: (file: FileMetadata) => void;
  onObfuscateSingle: (file: FileMetadata) => void;
};

export function FileList({
  files,
  selectedIds,
  onSelectionChange,
  onDescriptionChange,
  onOpenMapping,
  onDeleteSingle,
  onObfuscateSingle,
}: Props) {
  const toggle = (fileId: string) => {
    onSelectionChange(
      selectedIds.includes(fileId)
        ? selectedIds.filter((id) => id !== fileId)
        : [...selectedIds, fileId],
    );
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>선택</th>
            <th>파일명</th>
            <th>Description</th>
            <th>크기</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>
                <input
                  checked={selectedIds.includes(file.id)}
                  onChange={() => toggle(file.id)}
                  type="checkbox"
                />
              </td>
              <td>
                {file.is_obfuscated && (
                  <button
                    className="icon-button"
                    onClick={() => onOpenMapping(file)}
                    title="변조 매핑 보기"
                    type="button"
                  >
                    MOD
                  </button>
                )}
                {file.filename}
              </td>
              <td>
                <input
                  defaultValue={file.description}
                  onBlur={(event) => onDescriptionChange(file.id, event.currentTarget.value)}
                  placeholder="Description"
                />
              </td>
              <td>{Math.round(file.size_bytes / 1024)} KB</td>
              <td className="row-actions">
                <div className="row-actions-inner">
                  <a className="secondary-button small-link" href={fileDownloadUrl(file.id)}>
                    다운로드
                  </a>
                  <button
                    className="secondary-button small-link"
                    onClick={() => {
                      onObfuscateSingle(file);
                    }}
                    type="button"
                  >
                    변조
                  </button>
                  <button
                    className="secondary-button small-link"
                    onClick={() => {
                      onDeleteSingle(file);
                    }}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
