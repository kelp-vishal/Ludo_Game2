// User interfaces
export interface IUser {
  id: number;
  username: string;
  email: string;
}

// Auth response interfaces
export interface ILoginResponse {
  access_token: string;
  accessToken?: string;
  user: IUser;
}

export interface IRegisterResponse {
  message?: string;
  user: IUser;
}

export interface IAuthResponse {
  accessToken?: string;
  user: IUser;
}
