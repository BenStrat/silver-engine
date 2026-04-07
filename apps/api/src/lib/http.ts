export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<T> = T;

export type ApiRouteResult<T> = {
  status: number;
  body: T | ApiErrorBody;
};

export const ok = <T>(body: T, status = 200): ApiRouteResult<T> => ({
  status,
  body,
});

export const fail = (
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): ApiRouteResult<never> => ({
  status,
  body: {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  },
});
