import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Converte respostas problem+json em erros tipados */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const problem = err.error as ProblemDetail;
        return throwError(() => ({
          status: err.status,
          title: problem?.title ?? err.statusText,
          detail: problem?.detail,
          errors: problem?.errors,
        } satisfies ProblemDetail));
      }
      return throwError(() => err);
    }),
  );
};
