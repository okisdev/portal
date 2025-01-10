import bcrypt from 'bcrypt-edge';

export const encryptPassword = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};
