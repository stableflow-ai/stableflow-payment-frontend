export interface AuthUser {
  id: number;
  email: string;
  name: string;
  guideCompleted: boolean;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  code: string;
}

export interface RegisterCodeBody {
  email: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordCodeBody {
  email: string;
}

export interface ResetPasswordBody {
  email: string;
  code: string;
  newPassword: string;
}
