import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';

export interface DashboardStats {
  tasks: number;
  tasksDue: number;
  meetings: number;
  meetingsToday: number;
  mails: number;
  mailsUnread: number;
  events: number;
  notes: number;
  notesRecent: number;
  documents: number;
  personals: number;
  personalRecent: number;

}

export interface DashboardTaskStatus {
  label: string;
  count: number;
  color: string;
}

export interface DashboardRecentTask {
  id: string;
  name: string;
  board: string;
  boardColor: string;
  dueDate: string;
  isOverdue: boolean;
  statusLabel: string;
  statusColor: string;
  priorityColor: string;
  boardId: string;
  workspaceId: string;
}

export interface DashboardMeeting {
  id: string;
  date: string;
  time: string;
  name: string;
  location: string;
  attendees: string[];
  statusLabel: string;
  statusColor: string;
  color: string;
}

export interface DashboardEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  location?: string;
}

export interface DashboardMail {
  id: string;
  sender: string;
  senderInitial: string;
  subject: string;
  time: string;
  isRead: boolean;
  avatarColor: string;
  mailType: string;
  folderId: string;
}

export interface DashboardNote {
  id: string;
  sectionId: string;
  title: string;
  notebook: string;
  time: string;
  color: string;
}

export interface DashboardDocument {
  id: string;
  parentId: string;
  name: string;
  type: string;
  date: string;
  icon: string;
  iconBg: string;
  sizeText: string;
}

export interface DashboardSummary {
  stats: DashboardStats;
  taskStatusList: DashboardTaskStatus[];
  recentTasks: DashboardRecentTask[];
  upcomingMeetings: DashboardMeeting[];
  todayEvents: DashboardEvent[];
  recentMails: DashboardMail[];
  recentNotes: DashboardNote[];
  recentDocuments: DashboardDocument[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private common: CommonService) { }

  getSummary(): Observable<DashboardSummary> {
    return this.common.get<DashboardSummary>('Dashboard/Summary');
  }
}
