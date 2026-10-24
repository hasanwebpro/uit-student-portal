/** Resource models: one object per backend resource. Controllers (hooks) call these; views never touch fetch. */
import { api } from './api.js';

const withSignal = (path, params) => (signal) => api.get(path, params, signal);

export const AuthModel = {
  me: () => api.get('/auth/me'),
  login: (regNo, password, remember = false) => api.post('/auth/login', { regNo, password, remember }),
  logout: () => api.post('/auth/logout'),
  changePassword: (body) => api.post('/auth/change-password', body),
};

export const DashboardModel = { get: withSignal('/dashboard') };
export const CourseModel = { list: withSignal('/courses'), get: (id) => withSignal(`/courses/${id}`) };
export const AttendanceModel = { list: withSignal('/attendance'), get: (id) => withSignal(`/attendance/${id}`) };
export const TimetableModel = { get: withSignal('/timetable') };
export const AssessmentModel = { filters: withSignal('/assessments/filters'), list: (params) => withSignal('/assessments', params) };
export const RoadmapModel = { get: withSignal('/roadmap'), verify: (body) => api.put('/roadmap/verification', body) };
export const TranscriptModel = { programs: withSignal('/transcript/programs'), get: (program) => withSignal('/transcript', { program }) };
export const PloModel = { get: withSignal('/plo') };

export const ExamModel = {
  seating: withSignal('/exams/seating'),
  online: withSignal('/exams/online'),
  admitCard: (kind) => withSignal('/exams/admit-card', { kind }),
};

export const FeeModel = {
  ledger: (params) => withSignal('/fees/ledger', params),
  advance: withSignal('/fees/advance'),
  receipt: (id) => withSignal(`/fees/advance/${id}`),
};

export const TodoModel = {
  list: withSignal('/todos'),
  create: (body) => api.post('/todos', body),
  update: (id, body) => api.put(`/todos/${id}`, body),
  remove: (id) => api.del(`/todos/${id}`),
};

export const MessageModel = {
  list: (params) => withSignal('/messages', params),
  get: (id) => api.get(`/messages/${id}`),
  recipients: (params) => api.get('/messages/recipients', params),
  send: (body) => api.post('/messages', body),
  remove: (id) => api.del(`/messages/${id}`),
};

export const WorkflowModel = {
  list: withSignal('/workflows'),
  create: (body) => api.post('/workflows', body),
  update: (id, body) => api.put(`/workflows/${id}`, body),
  remove: (id) => api.del(`/workflows/${id}`),
  submit: (id) => api.post(`/workflows/${id}/submit`),
};

export const CommunityModel = {
  announcements: withSignal('/announcements'),
  surveys: (kind) => withSignal('/surveys', { kind }),
  respond: (id, body) => api.post(`/surveys/${id}/respond`, body),
  activity: (limit = 50) => withSignal('/activity', { limit }),
};

export const RegistrationModel = { get: withSignal('/registration'), submit: (sectionIds) => api.post('/registration', { sectionIds }) };
export const ProfileModel = {
  get: withSignal('/profile'), save: (body) => api.put('/profile', body),
  uploadAvatar: (blob) => api.putBlob('/profile/avatar', blob), removeAvatar: () => api.del('/profile/avatar'),
};
