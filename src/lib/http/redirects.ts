export const getRequestOrigin = (request: Request) => {
  const fallbackUrl = new URL(request.url);
  const protocol =
    request.headers.get("x-forwarded-proto") ?? fallbackUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    fallbackUrl.host;

  return `${protocol}://${host}`;
};

export const getSameOriginUrl = (request: Request, pathname: string) =>
  new URL(pathname, getRequestOrigin(request));
