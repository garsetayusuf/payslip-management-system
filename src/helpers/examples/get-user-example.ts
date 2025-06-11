import { v4 as uuidv4 } from 'uuid';

export function getUserExample(overrides: Partial<any> = {}): any {
  return {
    id: uuidv4(),
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    createdAt: new Date().toISOString(),
    createdBy: 'name',
    updatedAt: new Date().toISOString(),
    updatedBy: null,
    ...overrides,
  };
}
