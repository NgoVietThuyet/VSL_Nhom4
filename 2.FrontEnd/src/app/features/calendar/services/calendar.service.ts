import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  constructor(private common: CommonService) {}

  getCalendars() {
    return this.common.get('Calendar/Calendars', {});
  }
  createCalendar(dto: any) {
    return this.common.post('Calendar/Calendar', dto);
  }
  updateCalendar(id: string, dto: any) {
    return this.common.put(`Calendar/Calendar/${id}`, dto);
  }
  deleteCalendar(id: string) {
    return this.common.delete(`Calendar/Calendar/${id}`, {});
  }

  getEvents(start?: string, end?: string) {
    return this.common.get('Calendar/Events', { start, end });
  }
  getEventDetail(id: string) {
    return this.common.get(`Calendar/Event/${id}`, {}, true);
  }
  createEvent(dto: any) {
    return this.common.post('Calendar/Event', dto);
  }
  updateEvent(id: string, dto: any) {
    return this.common.put(`Calendar/Event/${id}`, dto);
  }
  deleteEvent(id: string) {
    return this.common.delete(`Calendar/Event/${id}`, {});
  }

  getCategories(workspaceId: string) {
    return this.common.get(`Calendar/Categories/${workspaceId}`, {});
  }
  createCategory(dto: any) {
    return this.common.post('Calendar/Category', dto);
  }
  updateCategory(id: string, dto: any) {
    return this.common.put(`Calendar/Category/${id}`, dto);
  }
  deleteCategory(id: string) {
    return this.common.delete(`Calendar/Category/${id}`, {});
  }

  getPermissions(calendarId: string) {
    return this.common.get(`Calendar/Permissions/${calendarId}`, {});
  }
  addPermission(dto: any) {
    return this.common.post('Calendar/Permission', dto);
  }
  removePermission(id: string) {
    return this.common.delete(`Calendar/Permission/${id}`, {});
  }

  getAttendees(eventId: string) {
    return this.common.get(`Calendar/Attendees/${eventId}`, {});
  }
  addAttendee(dto: any) {
    return this.common.post('Calendar/Attendee', dto);
  }
  removeAttendee(id: string) {
    return this.common.delete(`Calendar/Attendee/${id}`, {});
  }

  getReminders(eventId: string) {
    return this.common.get(`Calendar/Reminders/${eventId}`, {});
  }
  addReminder(dto: any) {
    return this.common.post('Calendar/Reminder', dto);
  }
  removeReminder(id: string) {
    return this.common.delete(`Calendar/Reminder/${id}`, {});
  }
}
