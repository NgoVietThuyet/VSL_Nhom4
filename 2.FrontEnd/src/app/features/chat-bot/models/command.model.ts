export type CommandType = 'navigation' | 'ui' | 'crud' | 'search' | 'workflow';

export type UiActionId =
  | 'minimize_chat'
  | 'maximize_chat'
  | 'close_chat'
  | 'toggle_sidebar'
  | 'enable_dark_mode'
  | 'disable_dark_mode'
  | 'clear_chat';

export interface CommandResult {
  isCommand: boolean;
  type?: CommandType;
  confidence: number;
  action?: string;
  target?: string;
  route?: string;
  message?: string;
  parameters?: Record<string, any>;
  source?: 'rule' | 'menu' | 'fuzzy' | 'llm';
}

export interface MenuContext {
  id: string;
  name: string;
  url: string;
  aliases?: string[];
}

export interface UiActionContext {
  action: UiActionId;
  description: string;
}

export interface InterpretCommandRequest {
  input: string;
  language?: string;
  menus: MenuContext[];
  uiActions: UiActionContext[];
}

export const COMMAND_CONFIDENCE = {
  exactRule: 1.0,
  alias: 0.95,
  fuzzyHigh: 0.9,
  fuzzyMid: 0.82,
  fuzzyLow: 0.75,
  llmHigh: 0.9,
  llmMid: 0.8,
  threshold: 0.7
} as const;
