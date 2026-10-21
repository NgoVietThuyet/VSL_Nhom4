import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { CalendarService } from '../services';
import {
  CalendarDto,
  CalendarEventDto,
  CalendarEventReminderDto,
  CalendarEventRecurrenceDto,
  EVENT_COLORS,
  RECURRENCE_TYPES,
  REMINDER_TYPES,
  REMINDER_TIMES,
  EVENT_STATUS,
  RECURRENCE_END_TYPES,
  DAYS_OF_WEEK,
} from '../models';

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface MiniDay {
  dayNum: number | null;
  dateStr: string;
  isToday: boolean;
  isSelected: boolean;
}

export interface DayEventItem {
  id: string;
  title: string;
  color: string;
  timeLabel: string;
  isAllDay: boolean;
  raw: CalendarEventDto;
}

export interface CalendarDay {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  visibleEvents: DayEventItem[];
  extraCount: number;
}

export interface EventWithPos {
  id: string;
  title: string;
  color: string;
  timeLabel: string;
  top: number;
  height: number;
  raw: CalendarEventDto;
}

export interface WeekDayCol {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
  allDayEvents: DayEventItem[];
  timedEvents: EventWithPos[];
}

export interface AgendaGroup {
  label: string;
  events: DayEventItem[];
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];
const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAY_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// 1px = 1 phút, 60px = 1 giờ — giống UnitCalendarComponent
const HOUR_HEIGHT_PX = 60;
const PX_PER_MIN = 1;

@Component({
  selector: 'app-calendar-home',
  imports: [SharedModules],
  templateUrl: './calendar-home.html',
  styleUrl: './calendar-home.scss',
})
export class CalendarHome implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();

  calendars: CalendarDto[] = [];
  events: CalendarEventDto[] = [];

  viewMode: ViewMode = 'month';
  currentDate: Date = new Date();
  viewTitle = '';

  readonly weekHeaderLabels = DAY_SHORT;

  // 24 nhãn giờ — giống dayHours bên UnitCalendarComponent
  readonly hourLabels: string[] = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, '0')}:00`
  );

  monthDays: CalendarDay[] = [];
  weekDays: WeekDayCol[] = [];
  dayAllDayEvents: DayEventItem[] = [];
  dayTimedEvents: EventWithPos[] = [];
  agendaGroups: AgendaGroup[] = [];
  miniDays: MiniDay[] = [];
  miniMonthTitle = '';
  selectedCalendarIds = new Set<string>();

  isCalendarModalVisible = false;
  isEditCalendar = false;
  calendarForm: CalendarDto = new CalendarDto();

  isEventModalVisible = false;
  isEditEvent = false;
  eventForm: CalendarEventDto = new CalendarEventDto();
  eventStartDate: Date | null = null;
  eventEndDate: Date | null = null;
  recurrenceEndDate: Date | null = null;

  isEventDetailVisible = false;
  selectedEvent: CalendarEventDto | null = null;
  selectedEventColor = '#189AD6';

  selectedDaysMap: { [key: string]: boolean } = {};

  readonly EVENT_COLORS = EVENT_COLORS;
  readonly RECURRENCE_TYPES = RECURRENCE_TYPES;
  readonly REMINDER_TYPES = REMINDER_TYPES;
  readonly REMINDER_TIMES = REMINDER_TIMES;
  readonly EVENT_STATUS = EVENT_STATUS;
  readonly RECURRENCE_END_TYPES = RECURRENCE_END_TYPES;
  readonly DAYS_OF_WEEK = DAYS_OF_WEEK;

  constructor(
    private calendarService: CalendarService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.loadCalendars();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.scrollToHour(7);
  }

  private scrollToHour(hour: number): void {
    setTimeout(() => {
      const wraps = document.querySelectorAll('.time-scroll-wrap');
      wraps.forEach(wrap => {
        wrap.scrollTop = hour * HOUR_HEIGHT_PX;
      });
    }, 100);
  }


  loadCalendars(): void {
    this.calendarService.getCalendars()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.calendars = data || [];
          this.calendars.forEach(c => this.selectedCalendarIds.add(c.id));
          this.loadEvents();
        },
        error: () => { this.buildView(); },
      });
  }

  loadEvents(): void {
    const { start, end } = this.getDateRange();
    this.calendarService.getEvents(start.toISOString(), end.toISOString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.events = data || [];
          this.buildView();
        },
        error: () => { this.buildView(); },
      });
  }

  private getDateRange(): { start: Date; end: Date } {
    const d = this.currentDate;
    const y = d.getFullYear();
    const m = d.getMonth();
    if (this.viewMode === 'month' || this.viewMode === 'agenda') {
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) };
    }
    if (this.viewMode === 'week') {
      const s = new Date(d); s.setDate(d.getDate() - d.getDay()); s.setHours(0, 0, 0, 0);
      const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    const s = new Date(d); s.setHours(0, 0, 0, 0);
    const e = new Date(d); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }


  private buildView(): void {
    this.buildMiniCalendar();
    this.buildViewTitle();
    if (this.viewMode === 'month') { this.buildMonthView(); }
    else if (this.viewMode === 'week') { this.buildWeekView(); }
    else if (this.viewMode === 'day') { this.buildDayView(); }
    else { this.buildAgendaView(); }

    // Sau khi đổi view scroll tới 07:00
    if (this.viewMode === 'week' || this.viewMode === 'day') {
      this.scrollToHour(7);
    }
  }

  private buildViewTitle(): void {
    const d = this.currentDate;
    const mn = MONTH_NAMES[d.getMonth()];
    if (this.viewMode === 'month' || this.viewMode === 'agenda') {
      this.viewTitle = `${mn} ${d.getFullYear()}`;
    } else if (this.viewMode === 'week') {
      const s = new Date(d); s.setDate(d.getDate() - d.getDay());
      const e = new Date(s); e.setDate(s.getDate() + 6);
      if (s.getMonth() === e.getMonth()) {
        this.viewTitle = `${s.getDate()} – ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
      } else {
        this.viewTitle = `${s.getDate()} ${MONTH_NAMES[s.getMonth()]} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
      }
    } else {
      this.viewTitle = `${DAY_LONG[d.getDay()]}, ${d.getDate()} ${mn} ${d.getFullYear()}`;
    }
  }

  private buildMonthView(): void {
    const d = this.currentDate;
    const y = d.getFullYear(); const m = d.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const today = this.toDateStr(new Date());
    const pad = first.getDay();
    const days: CalendarDay[] = [];

    for (let i = pad - 1; i >= 0; i--) {
      const dt = new Date(first); dt.setDate(dt.getDate() - (i + 1));
      days.push(this.makeMonthDay(dt, false, today));
    }
    for (let n = 1; n <= last.getDate(); n++) {
      days.push(this.makeMonthDay(new Date(y, m, n), true, today));
    }
    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++) {
      const dt = new Date(last); dt.setDate(dt.getDate() + i);
      days.push(this.makeMonthDay(dt, false, today));
    }
    this.monthDays = days;
  }

  private makeMonthDay(dt: Date, isCurrent: boolean, todayStr: string): CalendarDay {
    const dateStr = this.toDateStr(dt);
    const all = this.getEventsForDate(dateStr);
    return {
      dateStr,
      dayNum: dt.getDate(),
      isCurrentMonth: isCurrent,
      isToday: dateStr === todayStr,
      visibleEvents: all.slice(0, 3).map(e => this.makeDayEventItem(e)),
      extraCount: Math.max(0, all.length - 3),
    };
  }

  private buildWeekView(): void {
    const d = this.currentDate;
    const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); ws.setHours(0, 0, 0, 0);
    const today = this.toDateStr(new Date());
    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(ws); dt.setDate(ws.getDate() + i);
      const dateStr = this.toDateStr(dt);
      const evts = this.getEventsForDate(dateStr);
      return {
        dateStr,
        dayName: DAY_SHORT[i],
        dayNum: dt.getDate(),
        isToday: dateStr === today,
        allDayEvents: evts.filter(e => e.allDay).map(e => this.makeDayEventItem(e)),
        timedEvents: evts.filter(e => !e.allDay).map(e => this.makeEventWithPos(e)),
      };
    });
  }

  private buildDayView(): void {
    const dateStr = this.toDateStr(this.currentDate);
    const evts = this.getEventsForDate(dateStr);
    this.dayAllDayEvents = evts.filter(e => e.allDay).map(e => this.makeDayEventItem(e));
    this.dayTimedEvents = evts.filter(e => !e.allDay).map(e => this.makeEventWithPos(e));
  }

  private buildAgendaView(): void {
    const map = new Map<string, DayEventItem[]>();
    const filteredEvents = this.events.filter(e => !e.calendarId || this.selectedCalendarIds.has(e.calendarId));
    const sorted = [...filteredEvents].sort((a, b) =>
      (a.startTime ? +new Date(a.startTime) : 0) - (b.startTime ? +new Date(b.startTime) : 0)
    );
    for (const ev of sorted) {
      if (!ev.startTime) { continue; }
      const ds = this.toDateStr(new Date(ev.startTime));
      if (!map.has(ds)) { map.set(ds, []); }
      map.get(ds)!.push(this.makeDayEventItem(ev));
    }
    this.agendaGroups = [];
    map.forEach((evts, ds) => {
      const dt = new Date(ds + 'T00:00:00');
      this.agendaGroups.push({
        label: `${DAY_LONG[dt.getDay()]}, ${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`,
        events: evts,
      });
    });
  }

  private buildMiniCalendar(): void {
    const d = this.currentDate;
    const y = d.getFullYear(); const m = d.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const today = this.toDateStr(new Date());
    const sel = this.toDateStr(d);
    const pad = first.getDay();
    this.miniMonthTitle = `${MONTH_NAMES[m]} ${y}`;
    const cells: MiniDay[] = [];
    for (let i = 0; i < pad; i++) {
      cells.push({ dayNum: null, dateStr: '', isToday: false, isSelected: false });
    }
    for (let n = 1; n <= last.getDate(); n++) {
      const dt = new Date(y, m, n);
      const ds = this.toDateStr(dt);
      cells.push({ dayNum: n, dateStr: ds, isToday: ds === today, isSelected: ds === sel });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ dayNum: null, dateStr: '', isToday: false, isSelected: false });
    }
    this.miniDays = cells;
  }

  // ─── Event helpers ────────────────────────────────────────────────────────────

  private makeDayEventItem(e: CalendarEventDto): DayEventItem {
    const color = e.color || e.calendar?.color || '#189AD6';
    let timeLabel = 'Cả ngày';
    if (!e.allDay && e.startTime) {
      const s = new Date(e.startTime);
      timeLabel = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}`;
    }
    return {
      id: e.id,
      title: e.title || '(Không tiêu đề)',
      color,
      timeLabel,
      isAllDay: !!e.allDay,
      raw: e,
    };
  }

  /**
   * Tính top và height giống hệt UnitCalendarComponent:
   *   getEventTopPosition = startHour * 60 + startMinute  (px)
   *   getEventHeight      = durationMinutes               (px, min 30px)
   * Mỗi giờ = 60px, mỗi phút = 1px
   */
  private makeEventWithPos(e: CalendarEventDto): EventWithPos {
    const color = e.color || e.calendar?.color || '#189AD6';

    const start = e.startTime ? new Date(e.startTime) : new Date();
    const end = e.endTime
      ? new Date(e.endTime)
      : new Date(start.getTime() + 60 * 60 * 1000);

    const startHour = start.getHours();
    const startMin  = start.getMinutes();
    const endHour   = end.getHours();
    const endMin    = end.getMinutes();

    const top = startHour * HOUR_HEIGHT_PX + startMin * PX_PER_MIN;

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin   = Math.min(endHour * 60 + endMin, 24 * 60);
    const height = Math.max(endTotalMin - startTotalMin, 30);

    return {
      id: e.id,
      title: e.title || '(Không tiêu đề)',
      color,
      timeLabel: `${this.formatTime(start)} – ${this.formatTime(end)}`,
      top,
      height,
      raw: e,
    };
  }

  private getEventsForDate(dateStr: string): CalendarEventDto[] {
    return this.events.filter(e =>
      e.startTime && 
      this.toDateStr(new Date(e.startTime)) === dateStr &&
      (!e.calendarId || this.selectedCalendarIds.has(e.calendarId))
    );
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatTime(d: Date): string {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private syncDaysMap(): void {
    this.selectedDaysMap = {};
    const raw = this.eventForm.recurrence?.daysOfWeek || '';
    raw.split(',').filter(Boolean).forEach(v => { this.selectedDaysMap[v] = true; });
  }


  goToday(): void {
    this.currentDate = new Date();
    this.loadEvents();
  }

  goPrev(): void {
    const d = new Date(this.currentDate);
    if (this.viewMode === 'month' || this.viewMode === 'agenda') { d.setMonth(d.getMonth() - 1); }
    else if (this.viewMode === 'week') { d.setDate(d.getDate() - 7); }
    else { d.setDate(d.getDate() - 1); }
    this.currentDate = d;
    this.loadEvents();
  }

  goNext(): void {
    const d = new Date(this.currentDate);
    if (this.viewMode === 'month' || this.viewMode === 'agenda') { d.setMonth(d.getMonth() + 1); }
    else if (this.viewMode === 'week') { d.setDate(d.getDate() + 7); }
    else { d.setDate(d.getDate() + 1); }
    this.currentDate = d;
    this.loadEvents();
  }

  onViewModeChange(_mode: ViewMode): void {
    this.loadEvents();
  }

  miniPrev(): void {
    const d = new Date(this.currentDate);
    d.setMonth(d.getMonth() - 1);
    this.currentDate = d;
    this.loadEvents();
  }

  miniNext(): void {
    const d = new Date(this.currentDate);
    d.setMonth(d.getMonth() + 1);
    this.currentDate = d;
    this.loadEvents();
  }

  selectMiniDay(md: MiniDay): void {
    if (!md.dayNum) { return; }
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      md.dayNum
    );
    this.viewMode = 'day';
    this.loadEvents();
  }


  toggleCalendarFilter(calId: string): void {
    if (this.selectedCalendarIds.has(calId)) {
      this.selectedCalendarIds.delete(calId);
    } else {
      this.selectedCalendarIds.add(calId);
    }
    this.buildView();
  }

  showAllCalendars(): void {
    this.selectedCalendarIds.clear();
    this.calendars.forEach(c => this.selectedCalendarIds.add(c.id));
    this.buildView();
  }

  openCreateCalendar(): void {
    this.isEditCalendar = false;
    this.calendarForm = { id: '', name: '', color: '#189AD6' };
    this.isCalendarModalVisible = true;
  }

  openEditCalendar(cal: CalendarDto, e: Event): void {
    e.stopPropagation();
    this.isEditCalendar = true;
    this.calendarForm = { ...cal };
    this.isCalendarModalVisible = true;
  }

  saveCalendar(): void {
    if (!this.calendarForm.name?.trim()) {
      this.message.warning('Vui lòng nhập tên lịch!');
      return;
    }
    const call = this.isEditCalendar
      ? this.calendarService.updateCalendar(this.calendarForm.id, this.calendarForm)
      : this.calendarService.createCalendar(this.calendarForm);
    call.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          this.isCalendarModalVisible = false;
          this.loadCalendars();
        }
      },
      error: () => {},
    });
  }

  deleteCalendarById(cal: CalendarDto): void {
    if (cal.isDefault) { this.message.warning('Không thể xóa lịch mặc định!'); return; }
    this.calendarService.deleteCalendar(cal.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.loadCalendars(), error: () => {} });
  }

  selectCalendarColor(c: string): void { this.calendarForm.color = c; }


  openCreateEvent(dateStr?: string): void {
    this.isEditEvent = false;
    this.eventForm = new CalendarEventDto();
    this.eventForm.calendarId = this.calendars[0]?.id || '';
    this.eventForm.timeZone = 'Asia/Ho_Chi_Minh';
    this.eventForm.reminders = [];
    this.recurrenceEndDate = null;
    this.selectedDaysMap = {};

    let base: Date;
    if (dateStr) {
      base = new Date(dateStr + 'T08:00:00');
    } else {
      base = new Date();
      base.setMinutes(0, 0, 0);
    }
    this.eventStartDate = base;
    this.eventEndDate = new Date(base.getTime() + 3600000);
    this.isEventModalVisible = true;
  }

  openEditEvent(ev: CalendarEventDto, e?: Event): void {
    if (e) { e.stopPropagation(); }
    this.isEditEvent = true;
    this.eventForm = {
      ...ev,
      reminders: ev.reminders ? ev.reminders.map(r => ({ ...r })) : [],
      recurrence: ev.recurrence ? { ...ev.recurrence } : undefined,
    };
    this.eventStartDate = ev.startTime ? new Date(ev.startTime) : new Date();
    this.eventEndDate = ev.endTime ? new Date(ev.endTime) : new Date();
    this.recurrenceEndDate = ev.recurrence?.endDate ? new Date(ev.recurrence.endDate) : null;
    this.syncDaysMap();
    this.isEventModalVisible = true;
    this.isEventDetailVisible = false;
  }

  saveEvent(): void {
    if (!this.eventForm.title?.trim()) {
      this.message.warning('Vui lòng nhập tiêu đề sự kiện!');
      return;
    }
    if (this.eventStartDate) { this.eventForm.startTime = this.eventStartDate.toISOString(); }
    if (this.eventEndDate) { this.eventForm.endTime = this.eventEndDate.toISOString(); }
    if (this.eventForm.recurrence && this.recurrenceEndDate) {
      this.eventForm.recurrence = {
        ...this.eventForm.recurrence,
        endDate: this.recurrenceEndDate.toISOString(),
      };
    }

    const call = this.isEditEvent
      ? this.calendarService.updateEvent(this.eventForm.id, this.eventForm)
      : this.calendarService.createEvent(this.eventForm);
    call.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          this.isEventModalVisible = false;
          this.loadEvents();
        }
      },
      error: () => {},
    });
  }

  deleteEventById(ev: CalendarEventDto): void {
    this.calendarService.deleteEvent(ev.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isEventDetailVisible = false;
          this.selectedEvent = null;
          this.loadEvents();
        },
        error: () => {},
      });
  }

  showEventDetail(ev: CalendarEventDto): void {
    this.selectedEvent = ev;
    this.selectedEventColor = ev.color || ev.calendar?.color || '#189AD6';
    this.isEventDetailVisible = true;
  }

  closeEventDetail(): void {
    this.isEventDetailVisible = false;
    this.selectedEvent = null;
  }


  onRecurringChange(v: boolean): void {
    this.eventForm.isRecurring = v;
    if (v && !this.eventForm.recurrence) {
      this.eventForm.recurrence = new CalendarEventRecurrenceDto();
      this.selectedDaysMap = {};
    }
  }

  addReminder(): void {
    if (!this.eventForm.reminders) { this.eventForm.reminders = []; }
    this.eventForm.reminders = [...this.eventForm.reminders, new CalendarEventReminderDto()];
  }

  removeReminder(idx: number): void {
    if (!this.eventForm.reminders) { return; }
    this.eventForm.reminders = this.eventForm.reminders.filter((_, i) => i !== idx);
  }

  onStartDateChange(d: Date | null): void {
    this.eventStartDate = d;
    if (d && this.eventEndDate && d > this.eventEndDate) {
      this.eventEndDate = new Date(d.getTime() + 3600000);
    }
  }

  onEndDateChange(d: Date | null): void { this.eventEndDate = d; }

  onRecurrenceEndDateChange(d: Date | null): void { this.recurrenceEndDate = d; }

  toggleDayOfWeek(val: string): void {
    if (!this.eventForm.recurrence) { return; }
    const days = (this.eventForm.recurrence.daysOfWeek || '').split(',').filter(Boolean);
    const idx = days.indexOf(val);
    if (idx >= 0) { days.splice(idx, 1); } else { days.push(val); days.sort((a, b) => +a - +b); }
    this.eventForm.recurrence = { ...this.eventForm.recurrence, daysOfWeek: days.join(',') };
    this.syncDaysMap();
  }

  selectEventColor(c: string): void { this.eventForm.color = c; }

  // ─── Drag & Drop ─────────────────────────────────────────────────────────────

  // Thêm các property này vào class CalendarHome
  dragOverDateStr: string | null = null;
  draggingEventId: string | null = null;
  private dragOffsetY = 0;
  private draggingEvent: EventWithPos | null = null;
  private draggingFromDateStr: string | null = null;

  // Cập nhật lại onDragOver nhận 2 tham số
  onDragOver(event: DragEvent, dateStr?: string): void {
    event.preventDefault();
    if (dateStr) this.dragOverDateStr = dateStr;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDragStart(event: DragEvent, ep: EventWithPos, dateStr: string): void {
    this.draggingEventId = ep.id;
    this.draggingEvent = ep;
    this.draggingFromDateStr = dateStr;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.dragOffsetY = event.clientY - rect.top;

    event.dataTransfer?.setData('text/plain', ep.id);
    event.stopPropagation();
  }

  onDrop(event: DragEvent, targetDateStr: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverDateStr = null;

    if (!this.draggingEvent) { return; }

    const colEl = event.currentTarget as HTMLElement;
    const rect = colEl.getBoundingClientRect();
    const rawY = event.clientY - rect.top - this.dragOffsetY;

    // Làm tròn về bước 15 phút
    const totalMinutes = Math.round(rawY / 15) * 15;
    const clampedMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 45));

    const newHour = Math.floor(clampedMinutes / 60);
    const newMinute = clampedMinutes % 60;

    const rawEvent = this.draggingEvent.raw;
    const oldStart = rawEvent.startTime ? new Date(rawEvent.startTime) : new Date();
    const oldEnd   = rawEvent.endTime   ? new Date(rawEvent.endTime)   : new Date(oldStart.getTime() + 3600000);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(targetDateStr + 'T00:00:00');
    newStart.setHours(newHour, newMinute, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    const updatedEvent: CalendarEventDto = {
      ...rawEvent,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
    };

    this.draggingEventId = null;
    this.draggingEvent = null;
    this.draggingFromDateStr = null;

    this.calendarService.updateEvent(updatedEvent.id, updatedEvent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadEvents(),
        error: () => {
          this.message.error('Không thể cập nhật thời gian sự kiện!');
          this.loadEvents();
        },
      });
  }
  get currentDateStr(): string {
    return this.toDateStr(this.currentDate);
  }
}