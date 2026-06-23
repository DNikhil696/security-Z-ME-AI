import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Setup DOMPurify with JSDOM window for node backend use
let domPurifyInstance;
try {
  const window = new JSDOM('').window;
  domPurifyInstance = DOMPurify(window);
} catch (e) {
  console.warn("DOMPurify/JSDOM initialization failed. Using regex-based fallback security sanitization.", e);
}

/**
 * Validates text inputs to prevent command injection and directory traversal.
 */
export function validateInput(input) {
  if (typeof input !== 'string') {
    return { isValid: false, reason: 'Input must be a string' };
  }
  
  // Prevent common command injection characters
  const commandInjectionRegex = /[;&|`\$\(\)\{\}\[\]\<\>\*]/;
  if (commandInjectionRegex.test(input)) {
    return { isValid: false, reason: 'Input contains forbidden character (potential shell/command injection attempt)' };
  }
  
  // Prevent path traversal
  if (input.includes('..') || input.includes('/') && input.includes('\\')) {
    return { isValid: false, reason: 'Input contains path traversal indicators (.. or mixed slashes)' };
  }

  return { isValid: true };
}

/**
 * Sanitizes HTML input or outputs to prevent Cross-Site Scripting (XSS).
 */
export function sanitizeHTML(dirtyHTML) {
  if (typeof dirtyHTML !== 'string') return '';

  if (domPurifyInstance) {
    return domPurifyInstance.sanitize(dirtyHTML, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'code', 'pre', 'span', 'div', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'class', 'style']
    });
  }

  // Fallback regex sanitization if packages are not installed or failed to load
  let clean = dirtyHTML;
  // Strip out scripts
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[REMOVED SCRIPT]');
  // Strip out inline event handlers
  clean = clean.replace(/on\w+\s*=\s*(['"][^'"]*['"]|[^>\s]+)/gi, '[REMOVED EVENT]');
  // Strip out javascript: href urls
  clean = clean.replace(/href\s*=\s*['"]javascript:[^'"]*['"]/gi, 'href="#"');
  
  return clean;
}

/**
 * Checks if a system command execution payload is safe.
 */
export function validateCommandExecution(command, args = []) {
  const allowedCommands = ['git', 'npm', 'node', 'echo', 'mkdir', 'ls', 'dir'];
  
  const cleanCommand = command.trim().toLowerCase();
  
  if (!allowedCommands.includes(cleanCommand)) {
    return { isSafe: false, reason: `Command '${cleanCommand}' is not in the whitelist of approved commands` };
  }
  
  // Validate all args
  for (const arg of args) {
    const val = validateInput(arg);
    if (!val.isValid) {
      return { isSafe: false, reason: `Invalid parameter in command arguments: ${val.reason}` };
    }
  }
  
  return { isSafe: true };
}

/**
 * A basic static check of custom Javascript inputs (emulating a code sandbox).
 */
export function validateSandboxCode(code) {
  if (typeof code !== 'string') {
    return { isSafe: false, reason: 'Code must be a string' };
  }

  // Blacklist dangerous words / patterns
  const forbiddenPatterns = [
    'process.',
    'require(',
    'import ',
    'global.',
    'eval(',
    'Function(',
    'fs.',
    'child_process',
    'exec(',
    'spawn(',
    'XMLHttpRequest',
    'fetch(',
    'window.',
    'document.cookie',
    'localStorage',
    'sessionStorage',
    '__proto__',
    'constructor'
  ];

  for (const pattern of forbiddenPatterns) {
    if (code.includes(pattern)) {
      return { isSafe: false, reason: `Code contains dangerous execution reference: '${pattern}'` };
    }
  }

  return { isSafe: true };
}
