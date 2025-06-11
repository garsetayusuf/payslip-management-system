import { UserRole } from '@prisma/client';

export interface JwtUserInterface {
  id: string;
  email: string;
  employeeId: string;
  role: UserRole;
}
