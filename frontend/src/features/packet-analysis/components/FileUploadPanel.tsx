import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { API_BASE_URL } from '../../../shared/api/client';
import { deleteFiles, listFiles, obfuscateFiles, updateDescription, uploadFiles } from '../api';
import { FileMetadata } from '../types';
import { FileList } from './FileList';
import { ObfuscationMappingModal } from './ObfuscationMappingModal';

export function FileUploadPanel() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mappingFile, setMappingFile] = useState<FileMetadata | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const uploadControlsRef = useRef<HTMLDivElement | null>(null);
  const { data = [], error: listError, isLoading } = useQuery({ queryKey: ['files'], queryFn: listFiles });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['files'] });
  const uploadMutation = useMutation({
    mutationFn: uploadFiles,
    onError: (error) => setStatusMessage(error instanceof Error ? error.message : '업로드에 실패했습니다.'),
    onSuccess: async (files) => {
      setStatusMessage(`${files.length}개 파일 업로드가 완료되었습니다.`);
      await invalidate();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ fileId, description }: { fileId: string; description: string }) =>
      updateDescription(fileId, description),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFiles,
    onSuccess: (_, ids) => {
      setSelectedIds([]);
      setStatusMessage(`${ids.length}개 파일이 삭제되었습니다.`);
      invalidate();
    },
    onError: (error) => setStatusMessage(error instanceof Error ? error.message : '삭제에 실패했습니다.'),
  });
  const obfuscateMutation = useMutation({
    mutationFn: obfuscateFiles,
    onSuccess: (_, ids) => {
      setSelectedIds([]);
      setStatusMessage(`${ids.length}개 파일 변조가 완료되었습니다.`);
      invalidate();
    },
    onError: (error) => setStatusMessage(error instanceof Error ? error.message : '정보 변조에 실패했습니다.'),
  });

  const downloadSelected = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/packet/files/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: selectedIds }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'pcap_files.zip';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '다운로드에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!statusMessage) {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      return;
    }
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
      statusTimerRef.current = null;
    }, 10000);
    return () => {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
    };
  }, [statusMessage]);

  useEffect(() => {
    const controls = uploadControlsRef.current;
    const uploadButton = controls?.querySelector<HTMLElement>('.upload-action');
    const toolbarButtons = controls
      ? Array.from(controls.querySelectorAll<HTMLElement>('.toolbar-action'))
      : [];
    if (!controls || !uploadButton || toolbarButtons.length === 0) {
      return;
    }
    const uploadRect = uploadButton.getBoundingClientRect();
    const toolbarRect = toolbarButtons[0].getBoundingClientRect();
    // #region agent log
    fetch('http://127.0.0.1:7834/ingest/ec901763-4ccb-4152-a943-5ada5bb5c4d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8aeef7'},body:JSON.stringify({sessionId:'8aeef7',runId:'pre-fix',hypothesisId:'H1',location:'FileUploadPanel.tsx:layoutEffect',message:'upload controls alignment metrics',data:{uploadTop:uploadRect.top,uploadBottom:uploadRect.bottom,toolbarTop:toolbarRect.top,toolbarBottom:toolbarRect.bottom,topDelta:Math.abs(uploadRect.top-toolbarRect.top),uploadRight:uploadRect.right},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [selectedIds.length, statusMessage, data.length]);

  return (
    <section className="panel">
      <div className="upload-controls-row" ref={uploadControlsRef}>
        <div className="toolbar no-margin">
          <button
            className="secondary-button toolbar-action"
            disabled={selectedIds.length === 0}
            onClick={downloadSelected}
            type="button"
          >
            다운로드 받기
          </button>
          <button
            className="secondary-button toolbar-action"
            disabled={selectedIds.length === 0}
            onClick={() => deleteMutation.mutate(selectedIds)}
            type="button"
          >
            파일 삭제하기
          </button>
          <button
            className="secondary-button toolbar-action"
            disabled={selectedIds.length === 0}
            onClick={() => obfuscateMutation.mutate(selectedIds)}
            type="button"
          >
            IP 변조 파일 생성하기
          </button>
        </div>
        <label className="primary-button upload-action">
          {uploadMutation.isPending ? '업로드 중...' : 'pcap 업로드'}
          <input
            accept=".pcap,.pcapng"
            hidden
            multiple
            disabled={uploadMutation.isPending}
            onChange={(event) => {
              if (event.currentTarget.files) {
                const selectedFiles = Array.from(event.currentTarget.files);
                setStatusMessage(null);
                uploadMutation.mutate(selectedFiles);
                event.currentTarget.value = '';
              }
            }}
            type="file"
          />
        </label>
      </div>
      {statusMessage && <div className="status-banner">{statusMessage}</div>}
      {listError && (
        <div className="status-banner error">
          파일 목록을 불러오지 못했습니다. 백엔드 서버와 API 주소를 확인하세요.
        </div>
      )}
      {isLoading ? (
        <p>파일 목록을 불러오는 중입니다.</p>
      ) : (
        <FileList
          files={data}
          onDeleteSingle={(file) => {
            setStatusMessage(null);
            deleteMutation.mutate([file.id]);
          }}
          onDescriptionChange={(fileId, description) =>
            updateMutation.mutate({ fileId, description })
          }
          onObfuscateSingle={(file) => {
            setStatusMessage(null);
            obfuscateMutation.mutate([file.id]);
          }}
          onOpenMapping={setMappingFile}
          onSelectionChange={setSelectedIds}
          selectedIds={selectedIds}
        />
      )}
      {mappingFile && (
        <ObfuscationMappingModal file={mappingFile} onClose={() => setMappingFile(null)} />
      )}
    </section>
  );
}
