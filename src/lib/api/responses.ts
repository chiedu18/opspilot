import { NextResponse } from "next/server";

type ApiSuccessPayload<TData> = {
  data: TData;
};

type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

export const apiOk = <TData>(data: TData, init?: ResponseInit) =>
  NextResponse.json<ApiSuccessPayload<TData>>({ data }, init);

export const apiError = (
  code: string,
  message: string,
  init: ResponseInit = { status: 500 },
) => NextResponse.json<ApiErrorPayload>({ error: { code, message } }, init);
