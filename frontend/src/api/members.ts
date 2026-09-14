import axios from 'axios';
import { Member, MemberFormData, MemberFilters, MemberListResponse } from '../types/members';

const API_BASE = '/api/members';

export const membersApi = {
  // Get a list of filtered members
  getMembers: async (filters?: MemberFilters): Promise<MemberListResponse> => {
    const params = new URLSearchParams();

    if (filters?.is_founder !== undefined) {
      params.append('is_founder', String(filters.is_founder));
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `${API_BASE}/?${params.toString()}`;
    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  },

  // Get a member by ID
  getMember: async (id: number): Promise<Member> => {
    const response = await axios.get(`${API_BASE}/${id}/`, { withCredentials: true });
    return response.data;
  },

  // Create new member
  createMember: async (data: MemberFormData): Promise<Member> => {
    const response = await axios.post(`${API_BASE}/`, data, { withCredentials: true });
    return response.data;
  },

  // Update Member
  updateMember: async (id: number, data: Partial<MemberFormData>): Promise<Member> => {
    const response = await axios.patch(`${API_BASE}/${id}/`, data, { withCredentials: true });
    return response.data;
  },

  // Delete Member
  deleteMember: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/${id}/`, { withCredentials: true });
  },
};

export default membersApi;