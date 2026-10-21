import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../../../shared/services';
import { SystemMonitorSnapshot } from '../models/system-monitor.model';

@Injectable({ providedIn: 'root' })
export class SystemMonitorService {
  constructor(private common: CommonService) {}

  getSnapshot(): Observable<SystemMonitorSnapshot> {
    return this.common.get<SystemMonitorSnapshot>('SystemMonitor/Snapshot', {}, false);
  }

  getHistory(): Observable<SystemMonitorSnapshot[]> {
    return this.common.get<SystemMonitorSnapshot[]>('SystemMonitor/History', {}, false);
  }
}
