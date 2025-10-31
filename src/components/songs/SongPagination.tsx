
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface SongPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const SongPagination: React.FC<SongPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();

  return (
    <div className="flex justify-center mt-6 sm:mt-8 px-2 sm:px-0">
      <Pagination>
        <PaginationContent className="gap-1 sm:gap-2">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={`h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm ${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            />
          </PaginationItem>

          {visiblePages.map((page, index) => (
            <PaginationItem key={index} className="hidden sm:inline-flex">
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer h-8 sm:h-10 text-xs sm:text-sm"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Mobile: Show current page only */}
          <PaginationItem className="sm:hidden">
            <span className="flex h-8 items-center justify-center px-3 text-xs font-medium">
              {currentPage} / {totalPages}
            </span>
          </PaginationItem>

          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={`h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default SongPagination;
