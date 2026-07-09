export const EMAIL_PATTERN = {
  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Enter a valid email address.',
};

export const PHONE_PATTERN = {
  value: /^[+]?[\d\s().-]{7,20}$/,
  message: 'Enter a valid phone number.',
};

export const requiredRule = (label = 'This field') => ({ required: `${label} is required.` });

export const emailRule = { required: 'Email is required.', pattern: EMAIL_PATTERN };

export const phoneRule = { required: 'Phone number is required.', pattern: PHONE_PATTERN };

export const passwordRule = (minLength = 6) => ({
  required: 'Password is required.',
  minLength: { value: minLength, message: `Password must be at least ${minLength} characters.` },
});

export const confirmPasswordRule = (getValues) => ({
  required: 'Please confirm your password.',
  validate: (value) => value === getValues('password') || 'Passwords do not match.',
});

export const minLengthRule = (label, length) => ({
  required: `${label} is required.`,
  minLength: { value: length, message: `${label} must be at least ${length} characters.` },
});
