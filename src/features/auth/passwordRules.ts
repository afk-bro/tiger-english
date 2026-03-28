export const UPPERCASE_RE = /[A-Z]/;
export const SPECIAL_CHAR_RE = /[!@#$%^&*]/;
// SPECIAL_CHAR_RE is intentionally scoped to !@#$%^&* — matches the UI copy exactly.
// If the accepted set changes, update the regex, the label, and the authSchema error message together.

export type PasswordRule = {
  key: string;
  label: string;
  test: (v: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: "minLength",
    label: "At least 8 characters",
    test: (v: string) => v.length >= 8,
  },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (v: string) => UPPERCASE_RE.test(v),
  },
  {
    key: "special",
    label: "One special character (!@#$%^&*)",
    test: (v: string) => SPECIAL_CHAR_RE.test(v),
  },
];

export const isPasswordValid = (v: string) =>
  PASSWORD_RULES.every((r) => r.test(v));
