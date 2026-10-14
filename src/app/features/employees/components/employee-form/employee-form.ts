import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EmployeesService } from '../../services/employees-service';
import { DepartmentsService } from '../../../departments/services/departments-service';
import { Department, EmployeeInput } from '../../../../core/interfaces/employee.interface';
import {
  DEFAULT_FOUNDING_DATE,
  VALIDATION_MESSAGES,
} from '../../../../core/constants/validation.constant';
import { ConfirmService } from '../../../../core/services/confirm';
import {
  ageValidator,
  contractDateValidator,
  nationalIdValidator,
  nonEmptyValidator,
  phoneValidator,
  salaryValidator,
  timeRangeValidator,
} from '../../../../shared/validators/employee.validators';
import { TranslatedMessage, msg } from '../../../../shared/utils/i18n-key.util';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
})
export class EmployeeForm {
  private readonly fb = inject(FormBuilder);
  private readonly employeesService = inject(EmployeesService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly isEditMode = signal(false);
  readonly departments = signal<Department[]>([]);

  readonly messages = VALIDATION_MESSAGES;

  readonly foundingDate = signal(DEFAULT_FOUNDING_DATE);

  private employeeId: string | null = null;

  readonly form: FormGroup = this.fb.group({
    personal: this.fb.group(
      {
        full_name: ['', [Validators.required, nonEmptyValidator()]],
        address: ['', [Validators.required, nonEmptyValidator()]],
        phone_number: ['', [Validators.required, phoneValidator()]],
        date_of_birth: ['', [Validators.required, ageValidator()]],
        gender: ['', [Validators.required, Validators.pattern(/^(male|female)$/)]],
        national_id: ['', [Validators.required, nationalIdValidator()]],
        nationality: ['', [Validators.required, nonEmptyValidator()]],
      },
      { validators: egyptianNationalIdValidator() },
    ),
    work: this.fb.group(
      {
        department_id: ['', [Validators.required]],
        contract_date: [
          '',
          [Validators.required, contractDateValidator(() => this.foundingDate())],
        ],
        base_salary: ['', [Validators.required, salaryValidator()]],
        check_in_time: ['09:00', [Validators.required]],
        check_out_time: ['17:00', [Validators.required]],
      },
      { validators: timeRangeValidator() },
    ),
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.employeeId = idParam && idParam !== 'new' ? idParam : null;
    this.isEditMode.set(this.employeeId !== null);

    this.departmentsService.listDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => this.errorMessage.set(msg('employees.loadDepartmentsFailed')),
    });

    this.employeesService.getFoundingDate().subscribe({
      next: (date) => {
        this.foundingDate.set(date);
        this.form.get('work.contract_date')?.updateValueAndValidity();
      },
      error: () => this.errorMessage.set(msg('employees.loadFoundingDateFailed')),
    });

    if (!this.employeeId) {
      this.loading.set(false);
      return;
    }

    this.employeesService.getEmployee(this.employeeId).subscribe({
      next: (employee) => {
        this.form.patchValue({
          personal: {
            full_name: employee.full_name,
            address: employee.address,
            phone_number: employee.phone_number,
            date_of_birth: employee.date_of_birth,
            gender: employee.gender,
            national_id: employee.national_id,
            nationality: employee.nationality,
          },
          work: {
            department_id: employee.department_id ?? '',
            contract_date: employee.contract_date,
            base_salary: employee.base_salary,
            check_in_time: (employee.check_in_time ?? '').slice(0, 5),
            check_out_time: (employee.check_out_time ?? '').slice(0, 5),
          },
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('employees.loadEmployeeFailed'));
        this.loading.set(false);
      },
    });
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    if (this.isEditMode()) {
      const confirmed = await this.confirm.ask({
        titleKey: 'confirm.saveChangesTitle',
        messageKey: 'confirm.saveChangesMessage',
        params: { entity: this.translate.instant('nav.employees').toLowerCase() },
        variant: 'info',
      });
      if (!confirmed) return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const input = this.toInput();
    const request$ = this.isEditMode()
      ? this.employeesService.updateEmployee(this.employeeId!, input)
      : this.employeesService.createEmployee(input);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/employees']);
      },
      error: (err) => this.handleSaveError(err),
    });
  }

  fieldError(path: string): string | null {
    const control = this.form.get(path);
    if (!control || control.valid || !control.touched) return null;
    return this.messageFor(control.errors ?? {});
  }

  private messageFor(errors: Record<string, unknown>): string {
    if (errors['required']) return this.messages.required;
    if (errors['phone']) return this.messages.phone;
    if (errors['age']) return this.messages.age;
    if (errors['nationalId']) return this.messages.nationalId;
    if (errors['nationalIdDuplicate']) return this.messages.nationalIdDuplicate;
    if (errors['contractDate']) return this.messages.contractDate;
    if (errors['salary']) return this.messages.salary;
    if (errors['pattern']) return this.messages.gender;
    return this.messages.required;
  }

  private toInput(): EmployeeInput {
    const { personal, work } = this.form.getRawValue();
    return {
      full_name: String(personal.full_name).trim(),
      address: String(personal.address).trim(),
      phone_number: String(personal.phone_number).trim(),
      date_of_birth: personal.date_of_birth,
      gender: personal.gender,
      national_id: String(personal.national_id).trim(),
      nationality: String(personal.nationality).trim(),
      department_id: work.department_id,
      contract_date: work.contract_date,
      base_salary: Number(work.base_salary),
      check_in_time: work.check_in_time,
      check_out_time: work.check_out_time,
    };
  }

  private handleSaveError(err: any): void {
    this.saving.set(false);
    const message = String(err?.message ?? '');

    if (err?.code === '23505') {
      this.form.get('personal.national_id')?.setErrors({ nationalIdDuplicate: true });
      return;
    }
    if (message.includes('CONTRACT_DATE_BEFORE_FOUNDING')) {
      this.form.get('work.contract_date')?.setErrors({ contractDate: true });
      return;
    }
    if (err?.code === '23514' && message.includes('chk_employee_age')) {
      this.form.get('personal.date_of_birth')?.setErrors({ age: true });
      return;
    }
    if (err?.code === '23514' && message.includes('chk_employee_time_range')) {
      this.form.get('work')?.setErrors({ timeRange: true });
      return;
    }
    if (err?.code === '23502' && message.includes('department_id')) {
      this.form.get('work.department_id')?.setErrors({ required: true });
      return;
    }
    if (err?.code === '23503') {
      this.errorMessage.set(msg('employees.departmentMissing'));
      return;
    }
    this.errorMessage.set(
      msg(this.isEditMode() ? 'employees.updateFailed' : 'employees.createFailed'),
    );
  }
}

export function egyptianNationalIdValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const nidControl = control.get('national_id');
    const dobControl = control.get('date_of_birth');
    const genderControl = control.get('gender');

    if (!nidControl || !dobControl || !genderControl) {
      return null;
    }

    const nid = nidControl.value;
    const dobValue = dobControl.value;
    const gender = genderControl.value?.toLowerCase();

    if (!nid || !dobValue || !gender || nid.length !== 14) {
      return null;
    }

    const dob = new Date(dobValue);
    const fullYear = dob.getFullYear();
    const shortYear = fullYear % 100;
    const month = dob.getMonth() + 1;
    const day = dob.getDate();

    const nidCentury = parseInt(nid.charAt(0), 10);
    const nidYear = parseInt(nid.substring(1, 3), 10);
    const nidMonth = parseInt(nid.substring(3, 5), 10);
    const nidDay = parseInt(nid.substring(5, 7), 10);
    const nidGov = nid.substring(7, 9);
    const nidGenderDigit = parseInt(nid.charAt(12), 10);

    let expectedCentury: number;

    if (fullYear >= 1900 && fullYear <= 1999) {
      expectedCentury = 2;
    } else if (fullYear >= 2000 && fullYear <= 2099) {
      expectedCentury = 3;
    } else {
      nidControl.setErrors({ ...nidControl.errors, nationalId: true }, { emitEvent: false });
      return { national_Id: 'Year must be between 1900 and 2099' };
    }

    if (nidCentury !== expectedCentury) {
      nidControl.setErrors({ ...nidControl.errors, nationalId: true }, { emitEvent: false });
      return { national_Id: 'Century digit does not match birth year' };
    }

    if (shortYear !== nidYear || month !== nidMonth || day !== nidDay) {
      nidControl.setErrors({ ...nidControl.errors, nationalId: true }, { emitEvent: false });
      return { national_Id: 'Date of birth does not match NID' };
    }

    const validGovernorateCodes = [
      '01',
      '02',
      '03',
      '04',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '31',
      '32',
      '33',
      '34',
      '35',
      '88',
    ];

    if (!validGovernorateCodes.includes(nidGov)) {
      nidControl.setErrors({ ...nidControl.errors, nationalId: true }, { emitEvent: false });
      return { national_Id: 'Invalid governorate code' };
    }

    if (
      (gender === 'male' && nidGenderDigit % 2 === 0) ||
      (gender === 'female' && nidGenderDigit % 2 !== 0)
    ) {
      nidControl.setErrors({ ...nidControl.errors, nationalId: true }, { emitEvent: false });
      return { national_Id: 'Gender does not match NID' };
    }

    if (nidControl.errors) {
      const { nationalId, ...otherErrors } = nidControl.errors;
      if (Object.keys(otherErrors).length === 0) {
        nidControl.setErrors(null, { emitEvent: false });
      } else {
        nidControl.setErrors(otherErrors, { emitEvent: false });
      }
    }

    return null;
  };
}