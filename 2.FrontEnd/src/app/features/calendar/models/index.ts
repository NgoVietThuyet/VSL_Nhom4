export class CalendarDto {
  id: string = '';
  name: string = '';
  color: string = '#189AD6';
  ownerId?: string = '';
  workspaceId?: string = '';
  isDefault?: boolean = false;
  events?: CalendarEventDto[] = [];
}

export class CalendarEventDto {
  id: string = '';
  title: string = '';
  description?: string = '';
  startTime?: string;
  endTime?: string;
  allDay?: boolean = false;
  location?: string = '';
  status?: number = 0;
  visibility?: number = 0;
  color?: string;
  isRecurring?: boolean = false;
  timeZone?: string = 'Asia/Ho_Chi_Minh';
  calendarId?: string = '';
  calendar?: CalendarDto;
  attendees?: CalendarEventAttendeeDto[] = [];
  reminders?: CalendarEventReminderDto[] = [];
  categoryMappings?: CalendarEventCategoryMappingDto[] = [];
  exceptions?: CalendarEventExceptionDto[] = [];
  recurrence?: CalendarEventRecurrenceDto;
}

export class CalendarEventAttendeeDto {
  id: string = '';
  eventId?: string = '';
  userId?: string = '';
  role?: number = 0;
  responseStatus?: number = 0;
  isOrganizer?: boolean = false;
}

export class CalendarEventCategoryDto {
  id: string = '';
  name?: string = '';
  color?: string = '#189AD6';
  workspaceId?: string = '';
}

export class CalendarEventCategoryMappingDto {
  id?: string = '';
  eventId?: string = '';
  categoryId?: string = '';
}

export class CalendarEventExceptionDto {
  id: string = '';
  eventId?: string = '';
  exceptionDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  isCancelled?: boolean = false;
}

export class CalendarEventRecurrenceDto {
  id: string = '';
  eventId?: string = '';
  recurrenceType?: number = 0;
  interval?: number = 1;
  daysOfWeek?: string = '';
  dayOfMonth?: number;
  monthOfYear?: number;
  endType?: number = 0;
  endDate?: string;
  occurrenceCount?: number;
}

export class CalendarEventReminderDto {
  id: string = '';
  eventId?: string = '';
  reminderType?: number = 0;
  minutesBefore?: number = 30;
}

export class CalendarPermissionDto {
  id: string = '';
  calendarId?: string = '';
  userId?: string = '';
  permissionType?: number = 1;
}

export const EVENT_COLORS = [
  { value: '#189AD6', label: 'Xanh dương' },
  { value: '#52c41a', label: 'Xanh lá' },
  { value: '#faad14', label: 'Vàng' },
  { value: '#f5222d', label: 'Đỏ' },
  { value: '#722ed1', label: 'Tím' },
  { value: '#13c2c2', label: 'Xanh lam' },
  { value: '#eb2f96', label: 'Hồng' },
  { value: '#fa541c', label: 'Cam' },
  { value: '#2f54eb', label: 'Indigo' },
  { value: '#a0d911', label: 'Xanh vàng' },
];

export const RECURRENCE_TYPES = [
  { value: 0, label: 'Hằng ngày' },
  { value: 1, label: 'Hằng tuần' },
  { value: 2, label: 'Hằng tháng' },
  { value: 3, label: 'Hằng năm' },
];

export const REMINDER_TYPES = [
  { value: 0, label: 'Thông báo' },
  { value: 1, label: 'Email' },
];

export const REMINDER_TIMES = [
  { value: 5, label: '5 phút trước' },
  { value: 10, label: '10 phút trước' },
  { value: 15, label: '15 phút trước' },
  { value: 30, label: '30 phút trước' },
  { value: 60, label: '1 giờ trước' },
  { value: 120, label: '2 giờ trước' },
  { value: 1440, label: '1 ngày trước' },
];

export const EVENT_STATUS = [
  { value: 0, label: 'Xác nhận' },
  { value: 1, label: 'Tạm thời' },
  { value: 2, label: 'Đã hủy' },
];

export const RECURRENCE_END_TYPES = [
  { value: 0, label: 'Không kết thúc' },
  { value: 1, label: 'Theo ngày' },
  { value: 2, label: 'Theo số lần' },
];

export const DAYS_OF_WEEK = [
  { value: '0', label: 'CN' },
  { value: '1', label: 'T2' },
  { value: '2', label: 'T3' },
  { value: '3', label: 'T4' },
  { value: '4', label: 'T5' },
  { value: '5', label: 'T6' },
  { value: '6', label: 'T7' },
];
