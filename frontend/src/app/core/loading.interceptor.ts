import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Show loading
  loadingService.show();

  // Hide loading when request completes (success or error)
  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
