export function attendanceSummaryExample(overrides: Partial<any> = {}): any {
  return {
    total: 0,
    present: 0,
    absent: 0,
    attendanceRate: 0,
    ...overrides,
  };
}
