/**
 * Sanitization utilities for user inputs
 */

export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

export function sanitizeString(str: string): string {
    return str.trim();
}

export function sanitizeName(name: string): string {
    // Trim and normalize spaces
    return name.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize exam/question content (remove dangerous HTML if any)
 */
export function sanitizeContent(content: string): string {
    return content
        .trim()
        // Remove potential script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove potential event handlers
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Sanitize search query (prevent SQL/NoSQL injection patterns in search)
 */
export function sanitizeSearchQuery(query: string): string {
    return query
        .trim()
        .replace(/[<>{}]/g, '') // Remove brackets
        .substring(0, 200); // Limit length
}