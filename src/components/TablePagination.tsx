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

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

interface TablePaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  pagination,
  onPageChange,
  showInfo = true,
}) => {
  const { current_page, total_pages, total_count, per_page } = pagination;
  
  // Show info even on single page, but hide pagination controls
  const hasPagination = total_pages > 1;

  const generatePageNumbers = () => {
    const pages = [];
    const delta = 2; // Show 2 pages before and after current page
    
    for (let i = Math.max(1, current_page - delta); i <= Math.min(total_pages, current_page + delta); i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();
  const showStartEllipsis = pageNumbers[0] > 1;
  const showEndEllipsis = pageNumbers[pageNumbers.length - 1] < total_pages;

  const startItem = (current_page - 1) * per_page + 1;
  const endItem = Math.min(current_page * per_page, total_count);

  return (
    <div className="flex items-center justify-between px-2">
      {showInfo && (
        <div className="flex-1 text-sm text-muted-foreground">
          <span className="font-medium">{startItem}-{endItem}</span> of{' '}
          <span className="font-medium">{total_count}</span>
        </div>
      )}
      
      {hasPagination && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (current_page > 1) {
                    onPageChange(current_page - 1);
                  }
                }}
                className={current_page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {showStartEllipsis && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(1);
                    }}
                    className="cursor-pointer"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {pageNumbers[0] > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {pageNumbers.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                  isActive={current_page === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {showEndEllipsis && (
              <>
                {pageNumbers[pageNumbers.length - 1] < total_pages - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(total_pages);
                    }}
                    className="cursor-pointer"
                  >
                    {total_pages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (current_page < total_pages) {
                    onPageChange(current_page + 1);
                  }
                }}
                className={current_page >= total_pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default TablePagination;