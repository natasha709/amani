import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) =>
    api.post('/auth/register', data),
  me: () =>
    api.get('/auth/me'),
  updateProfile: (data: any) =>
    api.put('/auth/profile', data),
};

export const schoolApi = {
  getAll: () => api.get('/schools'),
  getById: (id: string) => api.get(`/schools/${id}`),
  create: (data: any) => api.post('/schools', data),
  update: (id: string, data: any) => api.put(`/schools/${id}`, data),
  delete: (id: string) => api.delete(`/schools/${id}`),
  getStats: (id: string) => api.get(`/schools/${id}/stats`),
};

export const studentApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  getFees: (id: string) => api.get(`/students/${id}/fees`),
};

export const feeApi = {
  getAll: (params?: any) => api.get('/fees', { params }),
  create: (data: any) => api.post('/fees', data),
  assign: (id: string, data: any) => api.post(`/fees/${id}/assign`, data),
  getCollections: (id: string) => api.get(`/fees/${id}/collections`),
};

export const paymentApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  create: (data: any) => api.post('/payments', data),
  getById: (id: string) => api.get(`/payments/${id}`),
  refund: (id: string) => api.post(`/payments/${id}/refund`),
};

export const academicApi = {
  getClasses: () => api.get('/academics/classes'),
  createClass: (data: any) => api.post('/academics/classes', data),
  getSubjects: (params?: any) => api.get('/academics/subjects', { params }),
  createSubject: (data: any) => api.post('/academics/subjects', data),
  getTerms: () => api.get('/academics/terms'),
  createTerm: (data: any) => api.post('/academics/terms', data),
  getRecords: (params?: any) => api.get('/academics/records', { params }),
  createRecord: (data: any) => api.post('/academics/records', data),
  assignSubjectToClass: (data: any) => api.post('/academics/class-subjects', data),
  removeSubjectFromClass: (id: string) => api.delete(`/academics/class-subjects/${id}`),
};

export const saccoApi = {
  getMembers: (params?: any) => api.get('/sacco/members', { params }),
  getMemberById: (id: string) => api.get(`/sacco/members/${id}`),
  getEligibleStaff: () => api.get('/sacco/eligible-staff'),
  registerMember: (data: any) => api.post('/sacco/members', data),
  getLoans: (params?: any) => api.get('/sacco/loans', { params }),
  createTransaction: (data: any) => api.post('/sacco/transactions', data),
  applyLoan: (data: any) => api.post('/sacco/loans', data),
  approveLoan: (id: string) => api.post(`/sacco/loans/${id}/approve`),
};

export const communicationApi = {
  getAnnouncements: (params?: any) => api.get('/communications/announcements', { params }),
  createAnnouncement: (data: any) => api.post('/communications/announcements', data),
  getMessages: () => api.get('/communications/messages'),
  getMessageById: (id: string) => api.get(`/communications/messages/${id}`),
  sendMessage: (data: any) => api.post('/communications/messages', data),
};

export const staffApi = {
  getAll: (schoolId: string) => api.get(`/schools/${schoolId}`).then(res => ({
    ...res,
    data: {
      ...res.data,
      data: res.data.data.users
    }
  })),
  create: (data: any) => api.post('/auth/register', data),
  update: (id: string, data: any) => api.put(`/auth/users/${id}`, data),
  delete: (id: string) => api.delete(`/auth/users/${id}`),
};

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getFinances: (params?: any) => api.get('/dashboard/finances', { params }),
  getAcademics: () => api.get('/dashboard/academics'),
  getSacco: () => api.get('/dashboard/sacco'),
  getActivity: () => api.get('/dashboard/activity'),
};

export default api;
