/**
 * Maps Convex/Auth errors to user-friendly messages
 */
export function mapAuthError(error: unknown): string {
  const errorMessage = extractErrorMessage(error);

  // Check for known error patterns and return friendly messages
  const errorMappings: Array<{ pattern: RegExp | string; message: string }> = [
    // Duplicate email
    {
      pattern: /already exists|duplicate|unique constraint/i,
      message: 'An account with this email already exists. Try signing in instead.',
    },
    // Invalid credentials
    {
      pattern: /invalid.*password|incorrect.*password|wrong.*password/i,
      message: 'Invalid email or password. Please try again.',
    },
    {
      pattern: /user not found|no user|account.*not.*found/i,
      message: 'No account found with this email. Please register first.',
    },
    // Validation errors
    {
      pattern: /ArgumentValidationError|does not match validator/i,
      message: 'Something went wrong. Please try again.',
    },
    // Password requirements
    {
      pattern: /password.*short|password.*length|password.*weak/i,
      message: 'Password must be at least 8 characters long.',
    },
    // Email validation
    {
      pattern: /invalid.*email|email.*invalid|email.*format/i,
      message: 'Please enter a valid email address.',
    },
    // Rate limiting
    {
      pattern: /too many|rate limit|try again later/i,
      message: 'Too many attempts. Please wait a moment and try again.',
    },
    // Network errors
    {
      pattern: /network|connection|timeout|fetch/i,
      message: 'Network error. Please check your connection and try again.',
    },
    // Token/session errors
    {
      pattern: /token.*expired|session.*expired|unauthorized/i,
      message: 'Your session has expired. Please sign in again.',
    },
    // OAuth errors
    {
      pattern: /oauth|provider.*error|authentication.*failed/i,
      message: 'Authentication failed. Please try again.',
    },
  ];

  for (const { pattern, message } of errorMappings) {
    if (typeof pattern === 'string') {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        return message;
      }
    } else if (pattern.test(errorMessage)) {
      return message;
    }
  }

  // Default fallback message
  return 'An unexpected error occurred. Please try again.';
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj && typeof errorObj['message'] === 'string') {
      return errorObj['message'];
    }
    if ('data' in errorObj && typeof errorObj['data'] === 'string') {
      return errorObj['data'];
    }
  }
  return 'Unknown error';
}
