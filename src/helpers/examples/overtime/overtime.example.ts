import { v4 as uuidv4 } from 'uuid';

export function overtimeExample(overrides: Partial<any> = {}): any {
  return {
    id: uuidv4(),
    employeeId: uuidv4(),
    attendancePeriodId: uuidv4(),
    date: new Date(),
    startTime: '18:00',
    endTime: '21:00',
    hoursWorked: 3,
    reason: 'Project deadline completion',
    description: 'Working on critical bug fixes for production release',
    status: 'PENDING',
    hasAttendance: true,
    submittedAt: new Date(),
    approvedAt: null,
    approvedById: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    employee: {
      id: uuidv4(),
      fullName: 'Howard Hoeger',
      employeeCode: 'EMP0001',
      department: 'Garden',
      position: 'Investor Mobility Facilitator',
    },
    attendancePeriod: {
      id: uuidv4(),
      name: '1 week period',
      startDate: '2025-06-10T00:00:00.000Z',
      endDate: '2025-06-17T00:00:00.000Z',
    },
    ...overrides,
  };
}
