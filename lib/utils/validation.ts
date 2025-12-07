// lib/utils/validation.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 *  至少 8 位
 *  至少 1 个大写字母
 *  至少 1 个小写字母
 *  至少 1 个数字
 *  至少 1 个特殊符号 @$!%*?&
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&,.])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const isValidCode = (code: string): boolean => {
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code.trim());
};
