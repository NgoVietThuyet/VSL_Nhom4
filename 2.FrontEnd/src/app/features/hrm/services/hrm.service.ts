import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import {
    HrmEmployeeDto, HrmEmployeeContactDto, HrmEmployeeDocumentDto,
    HrmContractDto, HrmShiftDto, HrmShiftAssignmentDto,
    HrmAttendanceDto, HrmLeaveTypeDto, HrmLeaveRequestDto,
    HrmSalaryStructureDto, HrmSalaryItemDto, HrmPayrollPeriodDto, HrmPayslipDto,
    HrmInsuranceDto, HrmTaxDto, HrmTrainingCourseDto, HrmTrainingEnrollmentDto,
    HrmEvaluationDto, HrmRewardDto,
    HrmRecruitmentPositionDto, HrmCandidateDto, HrmInterviewDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class HrmEmployeeService {
    constructor(private common: CommonService) { }
    search(p: HrmEmployeeDto) { return this.common.get('Hrm/Employee/Search', p); }
    detail(id: string) { return this.common.get(`Hrm/Employee/Detail/${id}`, {}); }
    insert(d: HrmEmployeeDto) { return this.common.post('Hrm/Employee/Insert', d); }
    update(d: HrmEmployeeDto) { return this.common.put('Hrm/Employee/Update', d); }
    delete(id: string) { return this.common.delete(`Hrm/Employee/Delete/${id}`, {}); }
    resign(id: string, d: any) { return this.common.post(`Hrm/Employee/Resign/${id}`, d); }
    orgTree() { return this.common.get('Hrm/Employee/Org-Tree', {}); }
    importExcel(d: HrmEmployeeDto[]) { return this.common.post('Hrm/Employee/Import', d); }
    export(p: HrmEmployeeDto) { return this.common.get('Hrm/Employee/Export', p); }
    dashboard() { return this.common.get('Hrm/Dashboard/Summary', {}); }
    contacts(employeeId: string) { return this.common.get(`Hrm/Employee/Contacts/${employeeId}`, {}); }
    saveContact(d: HrmEmployeeContactDto) { return this.common.post('Hrm/Employee/Contact/Save', d); }
    deleteContact(id: string) { return this.common.delete(`Hrm/Employee/Contact/Delete/${id}`, {}); }
    documents(employeeId: string) { return this.common.get(`Hrm/Employee/Documents/${employeeId}`, {}); }
    saveDocument(d: HrmEmployeeDocumentDto) { return this.common.post('Hrm/Employee/Document/Save', d); }
    deleteDocument(id: string) { return this.common.delete(`Hrm/Employee/Document/Delete/${id}`, {}); }
    getCodeConfig() { return this.common.get('Hrm/Employee/GetCodeConfig', {}); }
    saveCodeConfig(d: any) { return this.common.post('Hrm/Employee/SaveCodeConfig', d); }
}

@Injectable({ providedIn: 'root' })
export class HrmContractService {
    constructor(private common: CommonService) { }
    search(p: HrmContractDto) { return this.common.get('Hrm/Contract/Search', p); }
    detail(id: string) { return this.common.get(`Hrm/Contract/Detail/${id}`, {}); }
    insert(d: HrmContractDto) { return this.common.post('Hrm/Contract/Insert', d); }
    update(d: HrmContractDto) { return this.common.put('Hrm/Contract/Update', d); }
    terminate(id: string, d: any) { return this.common.post(`Hrm/Contract/Terminate/${id}`, d); }
    expiring() { return this.common.get('Hrm/Contract/Expiring', {}); }
    byEmployee(employeeId: string) { return this.common.get(`Hrm/Contract/ByEmployee/${employeeId}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class HrmAttendanceService {
    constructor(private common: CommonService) { }
    search(p: HrmAttendanceDto) { return this.common.get('Hrm/Attendance/Search', p); }
    checkin(d: any) { return this.common.post('Hrm/Attendance/Checkin', {}); }
    checkout(d: any) { return this.common.post('Hrm/Attendance/Checkout', {}); }
    adjust(d: HrmAttendanceDto) { return this.common.post('Hrm/Attendance/Adjust', d); }
    importData(d: any) { return this.common.post('Hrm/Attendance/Import', d); }
    recalculate(d: any) { return this.common.post('Hrm/Attendance/Recalculate', d); }
    summary(employeeId: string, year: number, month: number) { return this.common.get(`Hrm/Attendance/Summary/${employeeId}/${year}/${month}`, {}); }
    myAttendance(p: HrmAttendanceDto) { return this.common.get('Hrm/Attendance/My', p); }
}

@Injectable({ providedIn: 'root' })
export class HrmLeaveService {
    constructor(private common: CommonService) { }
    search(p: HrmLeaveRequestDto) { return this.common.get('Hrm/Leave/Search', p); }
    submit(d: HrmLeaveRequestDto) { return this.common.post('Hrm/Leave/Submit', d); }
    approve(id: string, leaveTypeCode: string) { return this.common.post('Hrm/Leave/Approve', { id, leaveTypeCode }); }
    cancel(id: string) { return this.common.post(`Hrm/Leave/Cancel/${id}`, {}); }
    balance(employeeId: string, year: number) { return this.common.get(`Hrm/Leave/Balance/${employeeId}/${year}`, {}); }
    recalculateBalance(year: number) { return this.common.post(`Hrm/Leave/RecalculateBalance/${year}`, {}); }
    myRequests(p: HrmLeaveRequestDto) { return this.common.get('Hrm/Leave/My', p); }
    getLeaveBalances(employeeId: string, year: number) { return this.common.get(`Hrm/Leave/Leaves/${employeeId}/${year}`, {}); }
    initializeLeaveBalances(year: number) { return this.common.post('Hrm/Leave/InitializeBalances', { year }); }
    deductBalance(employeeId: string, leaveTypeCode: string, year: number, days: number) {
        return this.common.post('Hrm/Leave/DeductBalance', { employeeId, leaveTypeCode, year, days });
    }
}

@Injectable({ providedIn: 'root' })
export class HrmPayrollService {
    constructor(private common: CommonService) { }
    searchPeriods(p: HrmPayrollPeriodDto) { return this.common.get('Hrm/Payroll/Period/Search', p); }
    createPeriod(d: HrmPayrollPeriodDto) { return this.common.post('Hrm/Payroll/Period/Create', d); }
    closePeriod(id: string) { return this.common.post(`Hrm/Payroll/Period/Close/${id}`, {}); }
    calculate(periodId: string, targetType?: string, targetId?: string) {
        let url = `Hrm/Payroll/Calculate/${periodId}`;
        const queryParams: string[] = [];
        if (targetType) queryParams.push(`targetType=${encodeURIComponent(targetType)}`);
        if (targetId) queryParams.push(`targetId=${encodeURIComponent(targetId)}`);
        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }
        return this.common.post(url, {});
    }
    payslip(id: string) { return this.common.get(`Hrm/Payroll/Payslip/${id}`, {}); }
    myPayslip(periodId: string) { return this.common.get(`Hrm/Payroll/Payslip/My/${periodId}`, {}); }
    myPayslips(p: HrmPayslipDto) { return this.common.get('Hrm/Payroll/Payslip/MyList', p); }
    pay(id: string) { return this.common.post(`Hrm/Payroll/Payslip/Pay/${id}`, {}); }
    export(periodId: string) { return this.common.get(`Hrm/Payroll/Export/${periodId}`, {}); }
    payslipsByPeriod(p: HrmPayslipDto) { return this.common.get('Hrm/Payroll/Payslip/Search', p); }
}

@Injectable({ providedIn: 'root' })
export class HrmRecruitmentService {
    constructor(private common: CommonService) { }
    searchPositions(p: HrmRecruitmentPositionDto) { return this.common.get('Hrm/Recruitment/Position/Search', p); }
    detailPosition(id: string) { return this.common.get(`Hrm/Recruitment/Position/Detail/${id}`, {}); }
    insertPosition(d: HrmRecruitmentPositionDto) { return this.common.post('Hrm/Recruitment/Position/Save', d); }
    updatePosition(d: HrmRecruitmentPositionDto) { return this.common.post('Hrm/Recruitment/Position/Save', d); }
    deletePosition(id: string) { return this.common.delete(`Hrm/Recruitment/Position/Delete/${id}`, {}); }
    searchCandidates(p: HrmCandidateDto) { return this.common.get('Hrm/Recruitment/Candidate/Search', p); }
    insertCandidate(d: HrmCandidateDto) { return this.common.post('Hrm/Recruitment/Candidate/Save', d); }
    updateCandidate(d: HrmCandidateDto) { return this.common.post('Hrm/Recruitment/Candidate/Save', d); }
    convertToEmployee(id: string) { return this.common.post(`Hrm/Recruitment/Candidate/Convert/${id}`, {}); }
    scheduleInterview(d: HrmInterviewDto) { return this.common.post('Hrm/Recruitment/Interview/Schedule', d); }
    updateInterview(d: HrmInterviewDto) { return this.common.put('Hrm/Recruitment/Interview/Update', d); }
}

@Injectable({ providedIn: 'root' })
export class HrmTrainingService {
    constructor(private common: CommonService) { }
    searchCourses(p: HrmTrainingCourseDto) { return this.common.get('Hrm/Training/Course/Search', p); }
    detailCourse(id: string) { return this.common.get(`Hrm/Training/Course/Detail/${id}`, {}); }
    insertCourse(d: HrmTrainingCourseDto) { return this.common.post('Hrm/Training/Course/Save', d); }
    updateCourse(d: HrmTrainingCourseDto) { return this.common.post('Hrm/Training/Course/Save', d); }
    deleteCourse(id: string) { return this.common.delete(`Hrm/Training/Course/Delete/${id}`, {}); }
    searchEnrollments(p: HrmTrainingEnrollmentDto) { return this.common.get('Hrm/Training/Enrollment/Search', p); }
    enroll(d: HrmTrainingEnrollmentDto) { return this.common.post('Hrm/Training/Enrollment/Enroll', d); }
    updateEnrollment(d: HrmTrainingEnrollmentDto) { return this.common.put('Hrm/Training/Enrollment/Update', d); }
}

@Injectable({ providedIn: 'root' })
export class HrmEvaluationService {
    constructor(private common: CommonService) { }
    search(p: HrmEvaluationDto) { return this.common.get('Hrm/Evaluation/Search', p); }
    detail(id: string) { return this.common.get(`Hrm/Evaluation/Detail/${id}`, {}); }
    insert(d: HrmEvaluationDto) { return this.common.post('Hrm/Evaluation/Insert', d); }
    update(d: HrmEvaluationDto) { return this.common.put('Hrm/Evaluation/Update', d); }
    delete(id: string) { return this.common.delete(`Hrm/Evaluation/Delete/${id}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class HrmRewardService {
    constructor(private common: CommonService) { }
    search(p: HrmRewardDto) { return this.common.get('Hrm/Reward/Search', p); }
    detail(id: string) { return this.common.get(`Hrm/Reward/Detail/${id}`, {}); }
    insert(d: HrmRewardDto) { return this.common.post('Hrm/Reward/Insert', d); }
    update(d: HrmRewardDto) { return this.common.put('Hrm/Reward/Update', d); }
    delete(id: string) { return this.common.delete(`Hrm/Reward/Delete/${id}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class HrmMasterDataService {
    constructor(private common: CommonService) { }
    searchShifts(p: HrmShiftDto) { return this.common.get('Hrm/MasterData/Shift/Search', p); }
    getAllShifts() { return this.common.get('Hrm/MasterData/Shift/GetAll', {}); }
    insertShift(d: HrmShiftDto) { return this.common.post('Hrm/MasterData/Shift/Insert', d); }
    updateShift(d: HrmShiftDto) { return this.common.put('Hrm/MasterData/Shift/Update', d); }
    deleteShift(id: string) { return this.common.delete(`Hrm/MasterData/Shift/Delete/${id}`, {}); }
    searchLeaveTypes(p: HrmLeaveTypeDto) { return this.common.get('Hrm/MasterData/LeaveType/Search', p); }
    getAllLeaveTypes() { return this.common.get('Hrm/MasterData/LeaveType/GetAll', {}); }
    insertLeaveType(d: HrmLeaveTypeDto) { return this.common.post('Hrm/MasterData/LeaveType/Insert', d); }
    updateLeaveType(d: HrmLeaveTypeDto) { return this.common.put('Hrm/MasterData/LeaveType/Update', d); }
    deleteLeaveType(id: string) { return this.common.delete(`Hrm/MasterData/LeaveType/Delete/${id}`, {}); }
    searchSalaryStructures(p: HrmSalaryStructureDto) { return this.common.get('Hrm/MasterData/SalaryStructure/Search', p); }
    getAllSalaryStructures() { return this.common.get('Hrm/MasterData/SalaryStructure/GetAll', {}); }
    insertSalaryStructure(d: HrmSalaryStructureDto) { return this.common.post('Hrm/MasterData/SalaryStructure/Insert', d); }
    updateSalaryStructure(d: HrmSalaryStructureDto) { return this.common.put('Hrm/MasterData/SalaryStructure/Update', d); }
    deleteSalaryStructure(id: string) { return this.common.delete(`Hrm/MasterData/SalaryStructure/Delete/${id}`, {}); }
    getSalaryItemsByStructure(structureId: string) { return this.common.get(`Hrm/MasterData/SalaryItem/GetByStructure/${structureId}`, {}); }
    saveSalaryItem(d: HrmSalaryItemDto) { return this.common.post('Hrm/MasterData/SalaryItem/Save', d); }
    deleteSalaryItem(id: string) { return this.common.delete(`Hrm/MasterData/SalaryItem/Delete/${id}`, {}); }
    searchInsurance(p: HrmInsuranceDto) { return this.common.get('Hrm/MasterData/Insurance/Search', p); }
    saveInsurance(d: HrmInsuranceDto) { return this.common.post('Hrm/MasterData/Insurance/Save', d); }
    searchTax(p: HrmTaxDto) { return this.common.get('Hrm/MasterData/Tax/Search', p); }
    saveTax(d: HrmTaxDto) { return this.common.post('Hrm/MasterData/Tax/Save', d); }
}
