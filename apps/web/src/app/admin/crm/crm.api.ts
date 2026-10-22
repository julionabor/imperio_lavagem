import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  kind: 'OPEN' | 'WON' | 'LOST';
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ContactSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  locality: string | null;
  lifecycle: string;
  lastInteractionAt: string | null;
  tags: Tag[];
  _count: { leads: number; activities: number };
}

export interface Activity {
  id: string;
  contactId: string;
  leadId: string | null;
  type: string;
  direction: 'IN' | 'OUT';
  summary: string;
  occurredAt: string;
  author: { name: string } | null;
}

export interface Task {
  id: string;
  contactId: string;
  leadId: string | null;
  title: string;
  dueAt: string;
  status: 'OPEN' | 'DONE' | 'CANCELLED';
  completedAt: string | null;
  contact: { name: string; phone: string };
  lead: { id: string; type: string } | null;
  assignee: { name: string } | null;
}

export interface LeadSummary {
  id: string;
  type: string;
  source: string;
  status: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  stageId: string | null;
  assignedToId: string | null;
  createdAt: string;
  contact: { name: string; phone: string; email: string | null };
  vehicle: { slug: string; brand: { name: string }; model: { name: string } } | null;
  assignedTo: { name: string } | null;
  stage: { name: string; color: string } | null;
}

export interface CrmReports {
  totalLeads: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  wonThisMonth: number;
  conversionRate: number;
  openTasks: number;
  byStage: { name: string; color: string; count: number }[];
  byType: { type: string; count: number }[];
  bySource: { source: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class CrmApi {
  private readonly http = inject(HttpClient);

  // Pipeline stages
  listStages() {
    return this.http.get<PipelineStage[]>('/api/v1/admin/pipeline-stages');
  }
  createStage(data: Partial<PipelineStage>) {
    return this.http.post<PipelineStage>('/api/v1/admin/pipeline-stages', data);
  }
  updateStage(id: string, data: Partial<PipelineStage>) {
    return this.http.patch<PipelineStage>(`/api/v1/admin/pipeline-stages/${id}`, data);
  }
  deleteStage(id: string) {
    return this.http.delete(`/api/v1/admin/pipeline-stages/${id}`);
  }
  reorderStages(ids: string[]) {
    return this.http.patch('/api/v1/admin/pipeline-stages/reorder', { ids });
  }

  // Tags
  listTags() {
    return this.http.get<Tag[]>('/api/v1/admin/tags');
  }

  // Contacts
  listContacts(params: { q?: string; lifecycle?: string; page?: number; pageSize?: number } = {}) {
    let p = new HttpParams();
    if (params.q) p = p.set('q', params.q);
    if (params.lifecycle) p = p.set('lifecycle', params.lifecycle);
    if (params.page) p = p.set('page', String(params.page));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<{ data: ContactSummary[]; meta: { total: number; page: number; pageSize: number } }>(
      '/api/v1/admin/contacts',
      { params: p },
    );
  }
  getContact(id: string) {
    return this.http.get<ContactSummary & { leads: LeadSummary[]; activities: Activity[]; tasks: Task[] }>(
      `/api/v1/admin/contacts/${id}`,
    );
  }
  updateContact(id: string, data: object) {
    return this.http.patch<ContactSummary>(`/api/v1/admin/contacts/${id}`, data);
  }
  mergeContacts(keepId: string, mergeId: string) {
    return this.http.post('/api/v1/admin/contacts/merge', { keepId, mergeId });
  }
  anonymizeContact(id: string) {
    return this.http.post(`/api/v1/admin/contacts/${id}/anonymize`, {});
  }

  // Activities
  listActivities(contactId: string) {
    return this.http.get<Activity[]>(`/api/v1/admin/contacts/${contactId}/activities`);
  }
  createActivity(contactId: string, data: object) {
    return this.http.post<Activity>(`/api/v1/admin/contacts/${contactId}/activities`, data);
  }

  // Tasks
  listMyTasks() {
    return this.http.get<Task[]>('/api/v1/admin/tasks/mine');
  }
  listTasks(params: { status?: string; assigneeId?: string; page?: number } = {}) {
    let p = new HttpParams();
    if (params.status) p = p.set('status', params.status);
    if (params.assigneeId) p = p.set('assigneeId', params.assigneeId);
    if (params.page) p = p.set('page', String(params.page));
    return this.http.get<{ data: Task[]; meta: { total: number } }>('/api/v1/admin/tasks', { params: p });
  }
  createTask(data: object) {
    return this.http.post<Task>('/api/v1/admin/tasks', data);
  }
  updateTask(id: string, data: object) {
    return this.http.patch<Task>(`/api/v1/admin/tasks/${id}`, data);
  }
  deleteTask(id: string) {
    return this.http.delete(`/api/v1/admin/tasks/${id}`);
  }

  // Leads (pipeline)
  listLeads(params: { status?: string; stageId?: string; assignedToId?: string; page?: number; pageSize?: number } = {}) {
    let p = new HttpParams();
    if (params.status) p = p.set('status', params.status);
    if (params.page) p = p.set('page', String(params.page));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    if (params.assignedToId) p = p.set('assignedToId', params.assignedToId);
    return this.http.get<{ data: LeadSummary[]; meta: { total: number } }>('/api/v1/admin/leads', { params: p });
  }
  updateLeadStatus(id: string, data: object) {
    return this.http.patch(`/api/v1/admin/leads/${id}/status`, data);
  }
  assignLead(id: string, assignedToId: string | null) {
    return this.http.patch(`/api/v1/admin/leads/${id}/assign`, { assignedToId });
  }

  // Reports
  getReports() {
    return this.http.get<CrmReports>('/api/v1/admin/crm/reports');
  }
}
