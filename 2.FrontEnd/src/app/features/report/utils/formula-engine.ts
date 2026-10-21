/**
 * Formula Engine v2
 *
 * Supports:
 *  - Arithmetic: + - * / ( )
 *  - Functions: SUM, AVG, MIN, MAX, ROUND, ABS, IF, AND, OR, NOT
 *  - Cross-cell references via cellCode tokens (e.g. R1_C2)
 *  - Topological sort + circular reference detection
 *
 * Usage:
 *   const engine = new FormulaEngine(formulas, allCellCodes);
 *   const { values, errors } = engine.evaluate(currentValues);
 */

export interface FormulaSpec {
  targetCode: string;
  expression: string;
  orderNumber?: number;
}

export interface FormulaEvalResult {
  values: { [code: string]: string };
  errors: { [targetCode: string]: string };
  evaluationOrder: string[];
}

const FUNCTIONS: { [name: string]: (args: any[]) => any } = {
  SUM: (a) => a.flat().reduce((s: number, v: any) => s + (Number(v) || 0), 0),
  AVG: (a) => {
    const arr = a.flat().map((v: any) => Number(v) || 0);
    return arr.length ? arr.reduce((s: number, v: number) => s + v, 0) / arr.length : 0;
  },
  MIN: (a) => Math.min(...a.flat().map((v: any) => Number(v) || 0)),
  MAX: (a) => Math.max(...a.flat().map((v: any) => Number(v) || 0)),
  ROUND: (a) => {
    const n = Number(a[0]) || 0;
    const d = Number(a[1]) || 0;
    const m = Math.pow(10, d);
    return Math.round(n * m) / m;
  },
  ABS: (a) => Math.abs(Number(a[0]) || 0),
  IF: (a) => (a[0] ? a[1] : a[2]),
  AND: (a) => a.every((v: any) => !!v),
  OR: (a) => a.some((v: any) => !!v),
  NOT: (a) => !a[0],
};

/** Tokenize and convert a formula expression to JS code referencing values map. */
function compileExpression(expr: string, validCodes: Set<string>, deps: Set<string>): string {
  // Replace function names: SUM(...) → __FN__('SUM', [...])
  // We do a token-level walk to handle nested parens.
  let out = '';
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    // Identifier?
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[A-Za-z0-9_]/.test(expr[j])) j++;
      const word = expr.slice(i, j);
      // Function?
      if (FUNCTIONS[word.toUpperCase()] && expr[j] === '(') {
        // Find matching close paren and split args by commas at depth 0
        const fn = word.toUpperCase();
        let depth = 0;
        let k = j;
        for (; k < expr.length; k++) {
          if (expr[k] === '(') depth++;
          else if (expr[k] === ')') { depth--; if (depth === 0) break; }
        }
        const inner = expr.slice(j + 1, k);
        // Split args at top-level commas
        const args: string[] = [];
        let buf = '';
        let d2 = 0;
        for (const c of inner) {
          if (c === '(') { d2++; buf += c; }
          else if (c === ')') { d2--; buf += c; }
          else if (c === ',' && d2 === 0) { args.push(buf); buf = ''; }
          else buf += c;
        }
        if (buf.trim().length) args.push(buf);
        const compiledArgs = args.map(a => compileExpression(a, validCodes, deps));
        out += `__FN__('${fn}', [${compiledArgs.join(',')}])`;
        i = k + 1;
        continue;
      }
      // Cell code reference
      if (validCodes.has(word)) {
        deps.add(word);
        out += `(Number(__V__['${word}'])||0)`;
        i = j;
        continue;
      }
      // Boolean literals
      if (word === 'TRUE' || word === 'true') { out += 'true'; i = j; continue; }
      if (word === 'FALSE' || word === 'false') { out += 'false'; i = j; continue; }
      // Unknown identifier → 0
      out += '0';
      i = j;
      continue;
    }
    // Number
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      out += expr.slice(i, j);
      i = j;
      continue;
    }
    // Operators / parens / whitespace
    if ('+-*/()<>= !&|,'.includes(ch)) {
      // Translate Excel-style operators to JS
      if (ch === '=' && expr[i + 1] !== '=') { out += '=='; i++; continue; }
      if (ch === '<' && expr[i + 1] === '>') { out += '!='; i += 2; continue; }
      out += ch;
      i++;
      continue;
    }
    // Skip unrecognized
    i++;
  }
  return out;
}

export class FormulaEngine {
  private compiled: { target: string; fn: Function; deps: string[] } [] = [];
  private cyclic: string[] = [];
  private order: string[] = [];

  constructor(formulas: FormulaSpec[], allCellCodes: string[]) {
    const validCodes = new Set(allCellCodes);
    const depMap = new Map<string, string[]>();
    for (const f of formulas) {
      if (!f.targetCode || !f.expression) continue;
      const deps = new Set<string>();
      try {
        const body = compileExpression(f.expression, validCodes, deps);
        // eslint-disable-next-line no-new-func
        const fn = new Function('__V__', '__FN__', `return (${body || '0'});`);
        this.compiled.push({ target: f.targetCode, fn, deps: Array.from(deps) });
        depMap.set(f.targetCode, Array.from(deps));
      } catch {
        depMap.set(f.targetCode, []);
      }
    }
    // Topological sort with circular detection
    const visited = new Map<string, number>(); // 0=unvisited, 1=visiting, 2=done
    const topo: string[] = [];
    const targetSet = new Set(this.compiled.map(c => c.target));
    const visit = (node: string): boolean => {
      const state = visited.get(node) || 0;
      if (state === 2) return true;
      if (state === 1) { this.cyclic.push(node); return false; }
      visited.set(node, 1);
      const deps = depMap.get(node) || [];
      for (const d of deps) {
        if (targetSet.has(d)) {
          if (!visit(d)) { visited.set(node, 2); return false; }
        }
      }
      visited.set(node, 2);
      topo.push(node);
      return true;
    };
    for (const c of this.compiled) visit(c.target);
    this.order = topo;
  }

  get circularReferences(): string[] { return this.cyclic; }
  get evaluationOrder(): string[] { return this.order; }

  /** Direct dependencies of a target (cells the formula reads). */
  getDependencies(target: string): string[] {
    return this.compiled.find(c => c.target === target)?.deps || [];
  }

  /** Reverse: targets whose formulas reference the given code. */
  getDependents(code: string): string[] {
    return this.compiled.filter(c => c.deps.includes(code)).map(c => c.target);
  }

  /** Step-through debug for a single target with current values snapshot. */
  debug(target: string, values: { [code: string]: string }): { deps: { code: string; value: string }[]; result: string; error?: string } {
    const c = this.compiled.find(x => x.target === target);
    if (!c) return { deps: [], result: '', error: 'Target không có công thức' };
    const deps = c.deps.map(d => ({ code: d, value: values[d] ?? '' }));
    try {
      const v = c.fn(values, (name: string, args: any[]) => FUNCTIONS[name](args));
      return { deps, result: String(v) };
    } catch (e: any) {
      return { deps, result: '', error: e?.message || 'Error' };
    }
  }

  evaluate(values: { [code: string]: string }): FormulaEvalResult {
    const result = { ...values };
    const errors: { [k: string]: string } = {};
    const fnMap = new Map(this.compiled.map(c => [c.target, c.fn]));
    for (const target of this.order) {
      const fn = fnMap.get(target);
      if (!fn) continue;
      try {
        const v = fn(result, (name: string, args: any[]) => FUNCTIONS[name](args));
        if (typeof v === 'boolean') result[target] = v ? '1' : '0';
        else if (typeof v === 'number' && isFinite(v)) result[target] = String(v);
        else if (v !== null && v !== undefined) result[target] = String(v);
      } catch (e: any) {
        errors[target] = e?.message || 'Error';
      }
    }
    for (const c of this.cyclic) errors[c] = 'Circular reference';
    return { values: result, errors, evaluationOrder: this.order };
  }
}
