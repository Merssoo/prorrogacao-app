export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const body = (error as { error?: { message?: string } }).error;
    if (body?.message) return body.message;
  }
  return fallback;
}

export function getErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'error' in error) {
    const body = (error as { error?: { code?: string } }).error;
    if (body?.code) return body.code;
  }
  return null;
}
