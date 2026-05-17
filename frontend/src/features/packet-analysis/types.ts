export type FileMetadata = {
  id: string;
  filename: string;
  description: string;
  size_bytes: number;
  uploaded_at: string;
  is_obfuscated: boolean;
  source_file_id?: string | null;
  mapping_group_id?: string | null;
};

export type ObfuscationMapping = {
  original_ip: string;
  obfuscated_ip: string;
  ip_version: number;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

export type AnalysisResponse = {
  session_id: string;
  answer: string;
  messages: ChatMessage[];
};
