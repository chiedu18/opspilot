export const DEMO_USER = {
  email: "olivia.chen@opspilot-demo.test",
  id: "team-olivia-chen",
  name: "Olivia Chen",
  role: "Operations Manager",
} as const;

export const DEMO_LOGIN_EMAIL = DEMO_USER.email;
export const DEMO_LOGIN_PASSWORD = "opspilot-demo";
export const DEMO_SESSION_COOKIE_NAME = "opspilot_demo_session";
export const DEMO_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export type DemoUser = typeof DEMO_USER;

export type DemoSession = {
  user: DemoUser;
  workspaceId: string;
  expiresAt: Date;
};

type DemoCredentials = {
  email: string;
  password: string;
};

export const validateDemoCredentials = ({ email, password }: DemoCredentials) =>
  email.toLowerCase() === DEMO_LOGIN_EMAIL && password === DEMO_LOGIN_PASSWORD;
