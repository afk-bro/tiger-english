// src/features/auth/constants.ts
export const ERROR_MESSAGES = {
    // Username errors
    USERNAME_TAKEN: 'This username is already taken. Please choose a different username.',
    USERNAME_INVALID: 'Invalid username provided.',
    // Email errors
    EMAIL_REGISTERED: 'This email is already registered. Please use a different email or try logging in.',
    EMAIL_INVALID: 'Invalid email provided.',
    // Password errors
    PASSWORD_INVALID: 'Invalid password provided.',
    // Name errors
    FIRST_NAME_INVALID: 'Invalid first name provided.',
    LAST_NAME_INVALID: 'Invalid last name provided.',
    // General errors
    SIGNUP_FAILED: 'Sign-up failed',
    PROFILE_CREATION_FAILED: 'Profile creation failed',
    NO_USER_OBJECT: 'No user object returned from Supabase.',
    ACCOUNT_CREATED: 'Account created successfully!',
};
export const SUCCESS_MESSAGES = {
    ACCOUNT_CREATED: "Account created successfully. Please check your email to verify.",
    PASSWORD_UPDATED: "Your password has been updated.",
    LOGGED_OUT: "You have been logged out successfully.",
};
export const ERROR_FIELD_MAPPING = {
    username: 'username',
    email: 'email',
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
};
export const SUPABASE_ERROR_CODES = {
    NO_ROWS_FOUND: 'PGRST116',
    DUPLICATE_KEY: '23505',
};
export const ERROR_KEYWORDS = {
    USER_ALREADY_REGISTERED: [
        'User already registered',
        'already registered',
        'already exists',
        'email address is already registered'
    ],
    DUPLICATE_KEY: ['duplicate key'],
    USERNAME_CONSTRAINT: ['username', 'profiles_username_key'],
    EMAIL_CONSTRAINT: ['email', 'profiles_email_key'],
    INVALID_EMAIL: ['Invalid email', 'email'],
    PASSWORD_RELATED: ['Password', 'password'],
    FIRST_NAME_RELATED: ['first_name'],
    LAST_NAME_RELATED: ['last_name'],
};
