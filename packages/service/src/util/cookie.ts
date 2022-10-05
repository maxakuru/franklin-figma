export async function validateCookie(
  key: string,
  expectedVal: string,
  req: Request
): Promise<boolean> {
  const cookieStr = req.headers.get('cookie');
  if (!cookieStr) {
    return false;
  }

  const cookies = cookieStr.split(';').map((s) => s.trim());
  const cookieObj: Record<string, string> = {};
  cookies.forEach((c) => {
    const [key, ...vals] = c.split('=');
    cookieObj[key] = vals.join('=');
  });

  return expectedVal === cookieObj[key];
}