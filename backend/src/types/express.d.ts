import { User } from '@prisma/client';

// Convert null to undefined for compatibility
type UserWithStringSchoolId = Omit<User, 'schoolId'> & {
  schoolId?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: UserWithStringSchoolId;
    }
  }
}
