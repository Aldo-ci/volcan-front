import { EMPTY, Observable, expand, reduce } from 'rxjs';
import { PaginatedResponse } from '../models/paginated-response.model';

interface FetchAllPagesOptions {
  limit?: number;
  startPage?: number;
}

export function fetchAllPages<T>(
  fetchPage: (params: { page: number; limit: number }) => Observable<PaginatedResponse<T>>,
  options: FetchAllPagesOptions = {}
): Observable<T[]> {
  const { limit = 100, startPage = 1 } = options;
  const initialParams = { page: startPage, limit };

  return fetchPage(initialParams).pipe(
    expand((response) => {
      if (response.meta.page < response.meta.totalPages) {
        return fetchPage({ ...initialParams, page: response.meta.page + 1 });
      }

      return EMPTY;
    }),
    reduce((allItems, response) => allItems.concat(response.data), [] as T[])
  );
}
