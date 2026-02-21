import { useState, useCallback, useMemo } from 'react';

interface PaginationOptions {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

export const usePagination = ({ totalItems, itemsPerPage = 10, initialPage = 1 }: PaginationOptions) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};
