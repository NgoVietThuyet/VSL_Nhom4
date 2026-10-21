import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { UiActionId } from '../../models/command.model';

export interface WorkspaceUiEvent {
  action: UiActionId;
  source?: 'voice' | 'text' | 'manual';
}

/**
 * Global bus for cross-cutting UI actions originating from the chatbot
 * (e.g. minimize chat popup, toggle the main sidebar).
 * MainLayout subscribes to this stream and reacts accordingly.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceUiService {
  private readonly events$ = new Subject<WorkspaceUiEvent>();

  readonly stream$ = this.events$.asObservable();

  dispatch(action: UiActionId, source: WorkspaceUiEvent['source'] = 'voice'): void {
    this.events$.next({ action, source });
  }
}
