import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommandResult, COMMAND_CONFIDENCE, MenuContext } from '../../models/command.model';
import { LlmCommandInterpreterService } from './llm-command-interpreter.service';
import { VoiceCommandService } from './voice-command.service';
import { CommandExecutionService } from './command-execution.service';

/**
 * Orchestrates command detection:
 *   1) try local rules/aliases/fuzzy (sync, fast)
 *   2) if confidence < threshold, ask the backend LLM
 *   3) return the best CommandResult
 *
 * Also exposes a helper to execute the result.
 */
@Injectable({ providedIn: 'root' })
export class VoiceAssistantService {
  /** Local confidence above which we skip the LLM round-trip entirely. */
  private readonly STRONG_LOCAL = 0.9;

  constructor(
    private rules: VoiceCommandService,
    private llm: LlmCommandInterpreterService,
    private executor: CommandExecutionService
  ) {}

  /**
   * Detect a command (does NOT execute). Returns the best candidate.
   * Always returns a CommandResult — caller must check isCommand & confidence.
   */
  async process(input: string, menus: MenuContext[]): Promise<CommandResult> {
    const trimmed = (input ?? '').trim();
    if (!trimmed) return { isCommand: false, confidence: 0 };

    const local = this.rules.detect(trimmed, menus);

    // Skip LLM if local detection is already very confident.
    if (local.isCommand && local.confidence >= this.STRONG_LOCAL) {
      return local;
    }

    let remote: CommandResult = { isCommand: false, confidence: 0 };
    try {
      remote = await firstValueFrom(this.llm.interpret(trimmed, menus));
    } catch {
      remote = { isCommand: false, confidence: 0 };
    }

    // Pick the higher-confidence interpretation.
    if (!remote?.isCommand) return local;
    if (!local.isCommand) return remote;
    return remote.confidence > local.confidence ? remote : local;
  }

  /**
   * Convenience: process + execute when confidence ≥ threshold.
   * Returns the result and whether it was executed.
   */
  async processAndExecute(
    input: string,
    menus: MenuContext[]
  ): Promise<{ result: CommandResult; executed: boolean }> {
    const result = await this.process(input, menus);
    const executed =
      result.isCommand &&
      result.confidence >= COMMAND_CONFIDENCE.threshold &&
      this.executor.execute(result);
    return { result, executed };
  }

  /** Execute a previously-detected command. Returns true if executed. */
  execute(cmd: CommandResult): boolean {
    return this.executor.execute(cmd);
  }
}
