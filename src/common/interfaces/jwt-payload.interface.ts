import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: Role;
  teacherId?: string;
  studentId?: string;
}
