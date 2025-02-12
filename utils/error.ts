import { CredentialsSignin } from 'next-auth';

export class UserNotFoundError extends CredentialsSignin {
  code = 'user_not_found';
  status = 404;
}

export class PasswordIncorrectError extends CredentialsSignin {
  code = 'password_incorrect';
  status = 401;
}

export class UserOrPasswordIncorrectError extends CredentialsSignin {
  code = 'user_or_password_incorrect';
  status = 401;
}

export class UnexpectedError extends CredentialsSignin {
  code = 'unexpected_error';
  status = 500;
}
