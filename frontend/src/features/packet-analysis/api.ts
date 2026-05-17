import { apiRequest } from '../../shared/api/client';
import { AnalysisResponse, FileMetadata, ObfuscationMapping } from './types';

export function listFiles() {
  return apiRequest<FileMetadata[]>('/packet/files');
}

export function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return apiRequest<FileMetadata[]>('/packet/files', { method: 'POST', body: formData });
}

export function updateDescription(fileId: string, description: string) {
  return apiRequest<FileMetadata>(`/packet/files/${fileId}`, {
    method: 'PATCH',
    body: JSON.stringify({ description }),
  });
}

export function deleteFiles(fileIds: string[]) {
  return apiRequest<FileMetadata[]>('/packet/files', {
    method: 'DELETE',
    body: JSON.stringify({ file_ids: fileIds }),
  });
}

export function obfuscateFiles(fileIds: string[]) {
  return apiRequest<FileMetadata[]>('/packet/files/obfuscate', {
    method: 'POST',
    body: JSON.stringify({ file_ids: fileIds }),
  });
}

export function getObfuscationMap(fileId: string) {
  return apiRequest<ObfuscationMapping[]>(`/packet/files/${fileId}/obfuscation-map`);
}

export function analyzePcap(payload: {
  file_ids: string[];
  source_ip?: string;
  destination_ip?: string;
  extra_message?: string;
}) {
  return apiRequest<AnalysisResponse>('/packet/analyze/pcap', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function analyzeDump(payload: {
  dump_text: string;
  source_ip?: string;
  destination_ip?: string;
  extra_message?: string;
}) {
  return apiRequest<AnalysisResponse>('/packet/analyze/dump', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function followUp(sessionId: string, message: string) {
  return apiRequest<AnalysisResponse>(`/packet/chat/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
