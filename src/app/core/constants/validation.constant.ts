// Mirrors the DB-level constraints in migration 0001, kept here so
// Angular validators and error messages stay in sync with the schema.
// Values are i18n keys (see src/assets/i18n/en.json); call sites
// translate them with the translate pipe/service.
export const COMPANY_FOUNDING_DATE = '2008-01-01';
export const NATIONAL_ID_LENGTH = 14;
export const MIN_PHONE_DIGITS = 11;
export const MIN_EMPLOYEE_AGE = 20;

export const PHONE_MIN_LENGTH = MIN_PHONE_DIGITS;
export const DEFAULT_FOUNDING_DATE = COMPANY_FOUNDING_DATE;

export const VALIDATION_MESSAGES = {
  required: 'validation.required',
  phone: 'validation.phone',
  age: 'validation.age',
  nationalId: 'validation.nationalId',
  nationalIdDuplicate: 'validation.nationalIdDuplicate',
  contractDate: 'validation.contractDate',
  salary: 'validation.salary',
  timeRange: 'validation.timeRange',
  gender: 'validation.gender',
  department: 'validation.department',
  fieldData: 'validation.fieldData',
  positiveNumber: 'validation.positiveNumber',
  nonNegativeNumber: 'validation.nonNegativeNumber',
  holidayDateDuplicate: 'validation.holidayDateDuplicate',
  holidayDateEarly: 'validation.holidayDateEarly',
  saveFailed: 'validation.saveFailed',
  employeeNotFound: 'validation.employeeNotFound',
} as const;

export const ATTENDANCE_MESSAGES = {
  searchRequired: 'attendance.messages.searchRequired',
  invalidDateRange: 'attendance.messages.invalidDateRange',
  noRecords: 'attendance.messages.noRecords',
  holiday: 'attendance.messages.holiday',
  duplicateRecord: 'attendance.messages.duplicateRecord',
  timeRange: 'attendance.messages.timeRange',
  oneTimeRequired: 'attendance.messages.oneTimeRequired',
  futureDate: 'attendance.messages.futureDate',
  employeeNotFound: 'attendance.messages.employeeNotFound',
  employeeSearchFailed: 'attendance.messages.employeeSearchFailed',
  createFailed: 'attendance.messages.createFailed',
  updateFailed: 'attendance.messages.updateFailed',
  deleteFailed: 'attendance.messages.deleteFailed',
  onlyXlsx: 'attendance.messages.onlyXlsx',
  fileTooLarge: 'attendance.messages.fileTooLarge',
  fileEmpty: 'attendance.messages.fileEmpty',
  noValidRows: 'attendance.messages.noValidRows',
  parseFailed: 'attendance.messages.parseFailed',
  tooManyRows: 'attendance.messages.tooManyRows',
  importFailed: 'attendance.messages.importFailed',
  reasonEmployeeNotFound: 'attendance.messages.reasonEmployeeNotFound',
  reasonHoliday: 'attendance.messages.reasonHoliday',
  reasonInvalidDate: 'attendance.messages.reasonInvalidDate',
  reasonTimeRange: 'attendance.messages.reasonTimeRange',
  reasonBeforeContract: 'attendance.messages.reasonBeforeContract',
  reasonFutureDate: 'attendance.messages.reasonFutureDate',
  reasonNoTimes: 'attendance.messages.reasonNoTimes',
  reasonInvalidNationalId: 'attendance.messages.reasonInvalidNationalId',
} as const;
