import { Injectable } from '@angular/core';
import { Observable, of, timeout, catchError, map } from 'rxjs';
import { CommonService } from '../../../../shared/services';
import { CommandResult, InterpretCommandRequest, MenuContext, UiActionContext } from '../../models/command.model';
import { detectLanguage, enrichMenusWithAliases, getDefaultUiActions } from './command-prompt-builder';

/**
 * Calls the backend LLM-based command interpreter.
 * Backend endpoint: POST /ChatBot/InterpretCommand
 */
@Injectable({ providedIn: 'root' })
export class LlmCommandInterpreterService {
  /** 2.5s budget per LLM call. */
  private readonly TIMEOUT_MS = 2500;

  constructor(private common: CommonService) {}

  interpret(input: string, menus: MenuContext[], uiActions?: UiActionContext[]): Observable<CommandResult> {
    const payload: InterpretCommandRequest = {
      input,
      language: detectLanguage(input),
      menus: enrichMenusWithAliases(menus),
      uiActions: uiActions ?? getDefaultUiActions()
    };

    return this.common.post<{ data?: CommandResult; status?: boolean }>('ChatBot/InterpretCommand', payload, false).pipe(
      timeout(this.TIMEOUT_MS),
      map(res => {
        const data: any = (res as any)?.data ?? res ?? {};
        return this.normalize(data, menus);
      }),
      catchError(() => of<CommandResult>({ isCommand: false, confidence: 0 }))
    );
  }

  /** Validates LLM output against the allowed menu list (defence in depth). */
  private normalize(raw: any, menus: MenuContext[]): CommandResult {
    if (!raw || typeof raw !== 'object') return { isCommand: false, confidence: 0 };
    const result: CommandResult = {
      isCommand: !!raw.isCommand,
      type: raw.type,
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0,
      action: raw.action,
      target: raw.target,
      route: raw.route,
      message: raw.message,
      parameters: raw.parameters ?? {},
      source: 'llm'
    };

    if (result.isCommand && result.type === 'navigation') {
      const lowerRoute = (result.route ?? '').toLowerCase();
      const lowerTarget = (result.target ?? '').toLowerCase();
      const match = menus.find(m =>
        (m.url && m.url.toLowerCase() === lowerRoute) ||
        (m.name && m.name.toLowerCase() === lowerTarget)
      );
      if (!match) {
        return { isCommand: false, confidence: 0 };
      }
      result.route = match.url;
      result.target = match.name;
    }
    return result;
  }
}
