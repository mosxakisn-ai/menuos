let cronSecretWarned = false;

export function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (!cronSecretWarned) {
      cronSecretWarned = true;
      console.warn("[menuos] CRON_SECRET unset — cron endpoints disabled");
    }
    return false;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}
