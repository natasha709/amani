type AuthUser = {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
