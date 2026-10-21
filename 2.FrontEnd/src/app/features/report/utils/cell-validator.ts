/**
 * Cell value validator.
 *
 * DataType examples: 'Number', 'Integer', 'Decimal', 'Currency', 'Percent', 'Text', 'Date'
 * ValidationRule (JSON): { min?: number, max?: number, regex?: string, required?: boolean }
 */

export interface ValidationResult { valid: boolean; error?: string; }

export function validateCell(
  value: string | null | undefined,
  dataTypeCode?: string | null,
  validationRule?: string | null
): ValidationResult {
  const v = (value ?? '').toString().trim();
  let rule: any = null;
  if (validationRule) {
    try { rule = JSON.parse(validationRule); } catch { rule = null; }
  }
  if (rule?.required && !v) return { valid: false, error: 'Bắt buộc nhập' };
  if (!v) return { valid: true };

  const dt = (dataTypeCode || '').toUpperCase();
  if (['NUMBER', 'DECIMAL', 'CURRENCY', 'PERCENT', 'INTEGER'].includes(dt)) {
    const n = Number(v);
    if (!isFinite(n)) return { valid: false, error: 'Giá trị không phải số' };
    if (dt === 'INTEGER' && !Number.isInteger(n)) return { valid: false, error: 'Phải là số nguyên' };
    if (rule?.min !== undefined && n < rule.min) return { valid: false, error: `Giá trị nhỏ nhất ${rule.min}` };
    if (rule?.max !== undefined && n > rule.max) return { valid: false, error: `Giá trị lớn nhất ${rule.max}` };
    return { valid: true };
  }
  if (dt === 'DATE') {
    const d = Date.parse(v);
    if (!isFinite(d)) return { valid: false, error: 'Ngày không hợp lệ' };
    return { valid: true };
  }
  if (rule?.regex) {
    try {
      const re = new RegExp(rule.regex);
      if (!re.test(v)) return { valid: false, error: rule.regexMessage || 'Sai định dạng' };
    } catch { /* ignore */ }
  }
  if (rule?.minLength !== undefined && v.length < rule.minLength) return { valid: false, error: `Tối thiểu ${rule.minLength} ký tự` };
  if (rule?.maxLength !== undefined && v.length > rule.maxLength) return { valid: false, error: `Tối đa ${rule.maxLength} ký tự` };
  return { valid: true };
}
