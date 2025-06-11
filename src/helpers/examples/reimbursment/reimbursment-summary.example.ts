export function reimbursmentSummaryExample(overrides: Partial<any> = {}): any {
  return {
    summary: [
      {
        status: 'PENDING',
        count: 0,
        totalAmount: 0,
      },
      {
        status: 'APPROVED',
        count: 0,
        totalAmount: 0,
      },
      {
        status: 'REJECTED',
        count: 0,
        totalAmount: 0,
      },
    ],
    overall: {
      totalCount: 0,
      totalAmount: 0,
    },
    ...overrides,
  };
}
