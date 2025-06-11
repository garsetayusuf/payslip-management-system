import { v4 as uuidv4 } from 'uuid';

export function attendanceExample(overrides: Partial<any> = {}): any {
  return {
    id: uuidv4(),
    employeeId: uuidv4(),
    attendancePeriodId: uuidv4(),
    date: new Date().toISOString(),
    checkInTime: new Date().toISOString(),
    checkOutTime: new Date().toISOString(),
    status: 'PRESENT',
    notes: 'Attended',
    ipAddress: '127.0.0.1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: uuidv4(),
    updatedById: null,
    ...overrides,
  };
}
