
export type DocumentCategory = 'founding' | 'internal' | 'protocol';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  founding: 'Основний документ',
  internal: 'Внутрішній документ',
  protocol: 'Протокол',
};

export const DOCUMENT_CATEGORY_KEYS: Record<DocumentCategory, string> = {
  founding: 'documents.categories.founding',
  internal: 'documents.categories.internal',
  protocol: 'documents.categories.protocol',
};

export interface OrgDocument {
  id: number;
  title: string;
  category: DocumentCategory;
  category_display: string;
  file: string; // URL
  uploaded_at: string;
}

export interface DocumentTemplate {
  id: number;
  title: string;
  description?: string;
  file: string;
  uploaded_at: string;
}