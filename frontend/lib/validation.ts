// URL validation utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export function validateUrl(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  // Check for basic malicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /onload=/i,
    /onerror=/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  // Add protocol if missing
  let formattedUrl = trimmed;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Validate URL format
  try {
    const url = new URL(formattedUrl);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Block localhost and private IPs for security
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return { isValid: false, error: 'Local and private URLs are not allowed' };
    }

    // Basic domain validation
    if (!hostname.includes('.') || hostname.length < 3) {
      return { isValid: false, error: 'Please enter a valid domain name' };
    }

    return { 
      isValid: true, 
      sanitizedValue: formattedUrl 
    };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check length limits
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  return { 
    isValid: true, 
    sanitizedValue: trimmed 
  };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }

  // Check for at least one letter and one number
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one letter and one number' };
  }

  return { isValid: true, sanitizedValue: password };
}
