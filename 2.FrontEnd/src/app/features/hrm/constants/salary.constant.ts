export interface SalaryItemTypeOption {
  value: string;
  label: string;
}

export type SalaryVariableCategoryKey = 'fixed' | 'allowance' | 'variable' | 'time' | 'deduction';

export interface SalaryVariableCategory {
  key: SalaryVariableCategoryKey;
  title: string;
  description: string;
}

export interface SalaryItemPreset {
  itemCode: string;
  itemName: string;
  type: string;
  amount: number;
  isTaxable: boolean;
  description: string;
  kind: 'system' | 'earning' | 'deduction';
  category: SalaryVariableCategoryKey;
}

export interface SalaryFormulaVariable {
  code: string;
  label: string;
  group: 'system' | 'component';
  kind: 'system' | 'earning' | 'deduction';
  category: SalaryVariableCategoryKey;
  description: string;
}

export interface SalaryFormulaToken {
  type: 'variable' | 'operator' | 'number';
  value: string;
  label: string;
}

export interface SalaryFormulaVariableGroup {
  key: SalaryVariableCategoryKey;
  title: string;
  description: string;
  kind: string;
  variables: SalaryFormulaVariable[];
}

export interface SalaryComponentVariableGroup {
  key: SalaryVariableCategoryKey;
  title: string;
  description: string;
  presets: SalaryItemPreset[];
}

export interface SalaryAvailableVariable {
  code: string;
  label: string;
  kind: 'system' | 'earning' | 'deduction';
  category: SalaryVariableCategoryKey;
  availableInFormula: boolean;
  availableAsComponent: boolean;
  componentType?: string;
  defaultAmount?: number;
  isTaxable?: boolean;
  description?: string;
}

export const SALARY_VARIABLE_CATEGORIES: readonly SalaryVariableCategory[] = [
  { key: 'fixed', title: 'Lương cố định', description: 'Nền lương theo hợp đồng' },
  { key: 'allowance', title: 'Phụ cấp & trợ cấp', description: 'Các khoản hỗ trợ theo chính sách' },
  { key: 'variable', title: 'Thu nhập biến đổi', description: 'Thưởng, hoa hồng, làm thêm giờ' },
  { key: 'time', title: 'Thời gian làm việc', description: 'Dữ liệu chấm công và nghỉ phép' },
  { key: 'deduction', title: 'Khấu trừ', description: 'Bảo hiểm, thuế và các khoản trừ' }
];

export const SALARY_AVAILABLE_VARIABLES: readonly SalaryAvailableVariable[] = [
  { code: 'BASIC_SALARY', label: 'Lương cơ bản', kind: 'earning', category: 'fixed', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Cơ sở tính bảo hiểm bắt buộc.' },
  { code: 'GROSS_SALARY', label: 'Lương chức danh / thỏa thuận', kind: 'earning', category: 'fixed', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Lương cố định cam kết hàng tháng.' },
  { code: 'STANDARD_WORK_DAYS', label: 'Ngày công chuẩn', kind: 'system', category: 'time', availableInFormula: true, availableAsComponent: true, componentType: 'SYSTEM_VARIABLE', defaultAmount: 22, isTaxable: false, description: 'Số ngày/giờ làm việc tiêu chuẩn.' },

  { code: 'POSITION_ALLOWANCE', label: 'Phụ cấp chức vụ', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo chức vụ hoặc vị trí.' },
  { code: 'SENIORITY_ALLOWANCE', label: 'Phụ cấp thâm niên', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo thời gian gắn bó.' },
  { code: 'RESPONSIBILITY_ALLOWANCE', label: 'Phụ cấp trách nhiệm', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo vai trò hoặc trách nhiệm bổ sung.' },
  { code: 'MEAL_ALLOWANCE', label: 'Phụ cấp ăn trưa / giữa ca', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: false, description: 'Theo chính sách bữa ăn.' },
  { code: 'TRANSPORT_ALLOWANCE', label: 'Phụ cấp xăng xe / đi lại', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: false, description: 'Hỗ trợ di chuyển.' },
  { code: 'PHONE_ALLOWANCE', label: 'Phụ cấp điện thoại', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: false, description: 'Hỗ trợ liên lạc.' },
  { code: 'HOUSING_ALLOWANCE', label: 'Trợ cấp nhà ở', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Hỗ trợ chỗ ở.' },
  { code: 'HAZARD_ALLOWANCE', label: 'Phụ cấp độc hại / nguy hiểm', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo điều kiện làm việc.' },
  { code: 'NIGHT_SHIFT_ALLOWANCE', label: 'Phụ cấp ca đêm', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Cho thời gian làm ca đêm.' },
  { code: 'AREA_ALLOWANCE', label: 'Phụ cấp khu vực', kind: 'earning', category: 'allowance', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo địa bàn làm việc.' },

  { code: 'PERFORMANCE_BONUS', label: 'Thưởng hiệu suất', kind: 'earning', category: 'variable', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo KPI hoặc mục tiêu.' },
  { code: 'COMMISSION', label: 'Hoa hồng', kind: 'earning', category: 'variable', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo doanh thu/lợi nhuận/sản lượng.' },
  { code: 'OVERTIME_PAY', label: 'Tiền làm thêm giờ', kind: 'earning', category: 'variable', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Khoản trả cho OT.' },
  { code: 'THIRTEENTH_MONTH_BONUS', label: 'Thưởng tháng 13', kind: 'earning', category: 'variable', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Thưởng tháng lương thứ 13.' },
  { code: 'PROJECT_BONUS', label: 'Thưởng dự án', kind: 'earning', category: 'variable', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo kết quả dự án.' },
  { code: 'INITIATIVE_BONUS', label: 'Thưởng sáng kiến', kind: 'earning', category: 'variable', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Cho sáng kiến/cải tiến.' },
  { code: 'HOLIDAY_BONUS', label: 'Thưởng lễ tết', kind: 'earning', category: 'variable', availableInFormula: true, availableAsComponent: true, componentType: 'EARNING_FIXED', defaultAmount: 0, isTaxable: true, description: 'Theo dịp lễ, tết.' },

  { code: 'ACTUAL_WORK_DAYS', label: 'Ngày công thực tế', kind: 'system', category: 'time', availableInFormula: true, availableAsComponent: true, componentType: 'SYSTEM_VARIABLE', defaultAmount: 0, isTaxable: false, description: 'Số ngày đi làm thực tế.' },
  { code: 'PAID_LEAVE_DAYS', label: 'Nghỉ phép năm', kind: 'system', category: 'time', availableInFormula: true, availableAsComponent: true, componentType: 'SYSTEM_VARIABLE', defaultAmount: 0, isTaxable: false, description: 'Ngày nghỉ vẫn hưởng lương.' },
  { code: 'UNPAID_LEAVE_DAYS', label: 'Nghỉ không lương', kind: 'system', category: 'time', availableInFormula: true, availableAsComponent: true, componentType: 'SYSTEM_VARIABLE', defaultAmount: 0, isTaxable: false, description: 'Ngày nghỉ bị trừ lương.' },
  { code: 'INSURANCE_LEAVE_DAYS', label: 'Nghỉ chế độ bảo hiểm', kind: 'system', category: 'time', availableInFormula: true, availableAsComponent: true, componentType: 'SYSTEM_VARIABLE', defaultAmount: 0, isTaxable: false, description: 'Ốm đau, thai sản, tai nạn.' },

  { code: 'STATUTORY_INSURANCE', label: 'Bảo hiểm bắt buộc', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_PERCENT', defaultAmount: 10.5, isTaxable: false, description: 'Tổng tỷ lệ bảo hiểm NLĐ đóng.' },
  { code: 'SOCIAL_INSURANCE', label: 'Bảo hiểm xã hội', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_PERCENT', defaultAmount: 8, isTaxable: false, description: 'Khoản trích BHXH.' },
  { code: 'HEALTH_INSURANCE', label: 'Bảo hiểm y tế', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_PERCENT', defaultAmount: 1.5, isTaxable: false, description: 'Khoản trích BHYT.' },
  { code: 'UNEMPLOYMENT_INSURANCE', label: 'Bảo hiểm thất nghiệp', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_PERCENT', defaultAmount: 1, isTaxable: false, description: 'Khoản trích BHTN.' },
  { code: 'PIT', label: 'Thuế thu nhập cá nhân', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_FIXED', defaultAmount: 0, isTaxable: false, description: 'Thuế phải khấu trừ.' },
  { code: 'PERSONAL_DEDUCTION', label: 'Giảm trừ bản thân', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_FIXED', defaultAmount: 0, isTaxable: false, description: 'Giảm trừ gia cảnh cá nhân.' },
  { code: 'DEPENDENT_DEDUCTION', label: 'Giảm trừ người phụ thuộc', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_FIXED', defaultAmount: 0, isTaxable: false, description: 'Theo số người phụ thuộc.' },
  { code: 'UNION_FEE', label: 'Đoàn phí công đoàn', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_PERCENT', defaultAmount: 1, isTaxable: false, description: 'Theo chính sách công đoàn.' },
  { code: 'ADVANCE', label: 'Tạm ứng lương', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_FIXED', defaultAmount: 0, isTaxable: false, description: 'Khoản đã tạm ứng.' },
  { code: 'PENALTY', label: 'Khoản phạt vi phạm', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_FIXED', defaultAmount: 0, isTaxable: false, description: 'Khoản phạt/khấu trừ hợp lệ.' },
  { code: 'COMPANY_LOAN', label: 'Khoản vay từ công ty', kind: 'deduction', category: 'deduction', availableInFormula: true, availableAsComponent: true, componentType: 'DEDUCTION_FIXED', defaultAmount: 0, isTaxable: false, description: 'Khoản vay cần thu hồi.' }
];

export const SALARY_ITEM_TYPES: readonly SalaryItemTypeOption[] = [
  { value: 'EARNING_DAILY', label: 'Thu nhập theo công' },
  { value: 'EARNING_FIXED', label: 'Thu nhập cố định' },
  { value: 'DEDUCTION_FIXED', label: 'Khấu trừ cố định' },
  { value: 'DEDUCTION_PERCENT', label: 'Khấu trừ theo tỷ lệ' },
  { value: 'SYSTEM_VARIABLE', label: 'Biến thời gian' }
];
