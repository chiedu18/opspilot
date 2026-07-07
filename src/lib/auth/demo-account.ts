export const DEMO_USER = {
  email: "olivia.chen@opspilot-demo.test",
  id: "team-olivia-chen",
  name: "Olivia Chen",
  role: "Operations Manager",
} as const;

export const DEMO_LOGIN_EMAIL = DEMO_USER.email;
export const DEMO_LOGIN_PASSWORD = "opspilot-demo";
export const DEMO_SESSION_COOKIE_NAME = "opspilot_demo_session";
export const DEMO_SESSION_COOKIE_VALUE = "opspilot-demo-session-v1";
export const DEMO_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type DemoUser = typeof DEMO_USER;

export type DemoSession = {
  user: DemoUser;
};

type DemoCredentials = {
  email: string;
  password: string;
};

export const validateDemoCredentials = ({ email, password }: DemoCredentials) =>
  email.toLowerCase() === DEMO_LOGIN_EMAIL && password === DEMO_LOGIN_PASSWORD;

export const getDemoSessionFromCookieValue = (
  value: string | undefined,
): DemoSession | null => {
  if (value !== DEMO_SESSION_COOKIE_VALUE) {
    return null;
  }

  return {
    user: DEMO_USER,
  };
};
