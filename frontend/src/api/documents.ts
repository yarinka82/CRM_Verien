
import apiClient from '@/api/client';
import type { OrgDocument, DocumentTemplate, DocumentCategory } from '@/types/documents';


const DOCUMENTS_URL = '/api/documents/';
const TEMPLATES_URL = '/api/document-templates/';

export const documentsApi = {
  // Institution documents

  getDocuments: async (category?: DocumentCategory): Promise<OrgDocument[]> => {
    const query = category ? `?category=${category}` : '';
    return apiClient.get(`${DOCUMENTS_URL}${query}`);
  },

  uploadDocument: async (
    title: string,
    category: DocumentCategory,
    file: File
  ): Promise<OrgDocument> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('file', file);

    // apiClient.post will understand that this is FormData, add CSRF and transfer the file
    return apiClient.post(DOCUMENTS_URL, formData);
  },

  deleteDocument: async (id: number): Promise<void> => {
    await apiClient.delete(`${DOCUMENTS_URL}${id}/`);
  },

  // Document templates

  getTemplates: async (): Promise<DocumentTemplate[]> => {
    return apiClient.get(TEMPLATES_URL);
  },

  uploadTemplate: async (
    title: string,
    description: string,
    file: File
  ): Promise<DocumentTemplate> => {
    const formData = new FormData();
    formData.append('title', title);
    if (description) {
      formData.append('description', description);
    }
    formData.append('file', file);

    return apiClient.post(TEMPLATES_URL, formData);
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`${TEMPLATES_URL}${id}/`);
  },
};

export default documentsApi;