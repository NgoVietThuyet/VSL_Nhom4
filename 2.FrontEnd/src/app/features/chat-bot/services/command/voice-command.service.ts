import { Injectable } from '@angular/core';
import { COMMAND_CONFIDENCE, CommandResult, MenuContext, UiActionContext } from '../../models/command.model';
import {
  enrichMenusWithAliases,
  getDefaultUiActions,
  getUiActionAliasMap,
  normalizeText,
  similarity,
  UI_ACTION_DEFS
} from './command-prompt-builder';

/**
 * Rule-based + alias + fuzzy command detection.
 * Pure synchronous logic; does NOT call any backend.
 */
@Injectable({ providedIn: 'root' })
export class VoiceCommandService {
  /** Tries to detect a command from input using rules, aliases and fuzzy matching. */
  detect(input: string, menus: MenuContext[]): CommandResult {
    const raw = (input ?? '').trim();
    if (!raw) return { isCommand: false, confidence: 0 };

    const normalized = normalizeText(raw);
    const enrichedMenus = enrichMenusWithAliases(menus);
    const uiActions = getDefaultUiActions();

    // 1) UI action match (exact / alias / fuzzy)
    const ui = this.detectUiAction(normalized, uiActions);
    // 2) Menu match (exact name / alias / fuzzy)
    const nav = this.detectMenu(normalized, enrichedMenus);

    // Pick best by confidence
    const candidates = [ui, nav].filter(c => c.isCommand);
    if (candidates.length === 0) return { isCommand: false, confidence: 0 };
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates[0];
  }

  // ------------------------------------------------------------------ menus
  private detectMenu(normalized: string, menus: MenuContext[]): CommandResult {
    let best: CommandResult = { isCommand: false, confidence: 0 };

    // Look for explicit verbs that strongly imply navigation
    const navVerbs = ['mo ', 'di toi ', 'vao ', 'chuyen sang ', 'kiem tra ', 'xem ', 'open ', 'go to ', 'take me to ', 'show me ', 'navigate to '];
    const hasNavVerb = navVerbs.some(v => normalized.startsWith(v) || normalized.includes(' ' + v.trim() + ' '));

    for (const m of menus) {
      if (!m?.url) continue;
      const nameNorm = normalizeText(m.name);

      // Exact name match
      if (nameNorm && normalized === nameNorm) {
        return this.buildNav(m, COMMAND_CONFIDENCE.exactRule, 'rule');
      }
      // Contains name as a token
      if (nameNorm && this.containsWord(normalized, nameNorm)) {
        const conf = hasNavVerb ? COMMAND_CONFIDENCE.exactRule : COMMAND_CONFIDENCE.alias;
        if (conf > best.confidence) best = this.buildNav(m, conf, 'rule');
      }

      // Alias match
      for (const alias of m.aliases ?? []) {
        const aliasNorm = normalizeText(alias);
        if (!aliasNorm) continue;
        if (normalized === aliasNorm) {
          return this.buildNav(m, COMMAND_CONFIDENCE.exactRule, 'rule');
        }
        if (this.containsWord(normalized, aliasNorm)) {
          const conf = hasNavVerb ? COMMAND_CONFIDENCE.alias : Math.max(COMMAND_CONFIDENCE.alias - 0.05, COMMAND_CONFIDENCE.fuzzyMid);
          if (conf > best.confidence) best = this.buildNav(m, conf, 'menu');
        }
      }

      // Fuzzy (only if input is short — otherwise too imprecise)
      if (normalized.length <= 40 && nameNorm) {
        const sim = similarity(normalized, nameNorm);
        if (sim >= 0.78 && sim > best.confidence) {
          best = this.buildNav(m, Math.min(COMMAND_CONFIDENCE.fuzzyHigh, sim), 'fuzzy');
        }
        for (const alias of m.aliases ?? []) {
          const sim2 = similarity(normalized, normalizeText(alias));
          if (sim2 >= 0.82 && sim2 > best.confidence) {
            best = this.buildNav(m, Math.min(COMMAND_CONFIDENCE.fuzzyHigh, sim2), 'fuzzy');
          }
        }
      }
    }

    return best;
  }

  private buildNav(menu: MenuContext, confidence: number, source: CommandResult['source']): CommandResult {
    return {
      isCommand: true,
      type: 'navigation',
      action: 'navigate',
      target: menu.name,
      route: menu.url,
      confidence,
      source,
      message: `Đang mở ${menu.name}...`
    };
  }

  // -------------------------------------------------------------- ui actions
  private detectUiAction(normalized: string, _uiActions: UiActionContext[]): CommandResult {
    let best: CommandResult = { isCommand: false, confidence: 0 };
    const aliasMap = getUiActionAliasMap();

    for (const def of UI_ACTION_DEFS) {
      const aliases = aliasMap[def.action] ?? [];
      for (const alias of aliases) {
        const aliasNorm = normalizeText(alias);
        if (!aliasNorm) continue;
        if (normalized === aliasNorm) {
          return this.buildUi(def.action, def.description, COMMAND_CONFIDENCE.exactRule, 'rule');
        }
        if (this.containsWord(normalized, aliasNorm)) {
          const conf = COMMAND_CONFIDENCE.alias;
          if (conf > best.confidence) best = this.buildUi(def.action, def.description, conf, 'rule');
        }
        // Fuzzy fallback for very similar phrases
        if (normalized.length <= 40) {
          const sim = similarity(normalized, aliasNorm);
          if (sim >= 0.85 && sim > best.confidence) {
            best = this.buildUi(def.action, def.description, Math.min(COMMAND_CONFIDENCE.fuzzyHigh, sim), 'fuzzy');
          }
        }
      }
    }
    return best;
  }

  private buildUi(action: string, description: string, confidence: number, source: CommandResult['source']): CommandResult {
    return {
      isCommand: true,
      type: 'ui',
      action,
      target: action,
      confidence,
      source,
      message: description
    };
  }

  // ----------------------------------------------------------------- helpers
  private containsWord(haystack: string, needle: string): boolean {
    if (!haystack || !needle) return false;
    if (haystack === needle) return true;
    // Match as whole word (with word boundaries) or as a substring with surrounding spaces
    const padded = ` ${haystack} `;
    const paddedNeedle = ` ${needle} `;
    if (padded.includes(paddedNeedle)) return true;
    // Allow needle at start/end of haystack
    return haystack.startsWith(needle + ' ') || haystack.endsWith(' ' + needle);
  }
}
