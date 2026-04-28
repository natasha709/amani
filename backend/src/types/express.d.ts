type AuthUser = {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
};

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
