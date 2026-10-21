import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommandResult, UiActionId } from '../../models/command.model';
import { WorkspaceUiService } from './workspace-ui.service';

/**
 * Executes a CommandResult. Side-effectful — should only be called after
 * the orchestrator has decided the confidence is sufficient.
 */
@Injectable({ providedIn: 'root' })
export class CommandExecutionService {
  constructor(
    private router: Router,
    private ngZone: NgZone,
    private workspaceUi: WorkspaceUiService
  ) {}

  /** Returns true if the command was executed (best-effort). */
  execute(cmd: CommandResult): boolean {
    if (!cmd?.isCommand) return false;
    switch (cmd.type) {
      case 'navigation':
        return this.executeNavigation(cmd.route);
      case 'ui':
        return this.executeUi(cmd.action as UiActionId);
      case 'crud':
      case 'workflow':
      case 'search':
        // Not yet implemented — return false so caller can fall back.
        return false;
      default:
        return false;
    }
  }

  private executeNavigation(route?: string): boolean {
    if (!route) return false;
    this.ngZone.run(() => this.router.navigateByUrl(route));
    return true;
  }

  private executeUi(action?: UiActionId): boolean {
    if (!action) return false;
    this.workspaceUi.dispatch(action, 'voice');
    return true;
  }
}
