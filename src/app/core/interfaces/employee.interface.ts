export type Gender = 'male' | 'female';

// Extra join field populated by EmployeesService (select departments(id, name)).
export interface EmployeeDepartmentRef {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  full_name: string;
  address: string;
  phone_number: string;
  date_of_birth: string;   // ISO date
  gender: Gender;
  national_id: string;
  nationality: string;
  department_id: string | null;
  contract_date: string;   // ISO date
  base_salary: number;
  check_in_time: string;   // 'HH:mm:ss'
  check_out_time: string;  // 'HH:mm:ss'
  departments?: EmployeeDepartmentRef | null;
}

// Insert/update payload — mirrors the non-generated employee columns.
export interface EmployeeInput {
  full_name: string;
  address: string;
  phone_number: string;
  date_of_birth: string;
  gender: Gender;
  national_id: string;
  nationality: string;
  department_id: string;
  contract_date: string;
  base_salary: number;
  check_in_time: string;
  check_out_time: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface DepartmentInput {
  name: string;
}
