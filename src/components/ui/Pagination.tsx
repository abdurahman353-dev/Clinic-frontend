import * as React from "react";
import {
  PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./shadcn-pagination";

export interface PaginationProps {
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
    from?: number;
    to?: number;
    per_page?: number;
  } | null;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  from?: number;
  to?: number;
  onPageChange: (page: number) => void;
  className?: string;
  showDetails?: boolean;
}

export function Pagination({
  meta,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  total: propTotal,
  from: propFrom,
  to: propTo,
  onPageChange,
  className = "",
  showDetails = true,
}: PaginationProps) {
  const current = propCurrentPage ?? meta?.current_page ?? 1;
  const lastPage = propTotalPages ?? meta?.last_page ?? 1;
  const totalItems = propTotal ?? meta?.total;
  const fromItem = propFrom ?? meta?.from ?? ((current - 1) * (meta?.per_page || 10) + 1);
  const toItem = propTo ?? meta?.to ?? Math.min(current * (meta?.per_page || 10), totalItems || 0);

  // Don't render anything at all when there's no data
  if (!totalItems || totalItems === 0) return null;

  const showNav = lastPage > 1;

  // Build page numbers with ellipses (shadcn standard)
  const getPageNumbers = () => {
    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis-end");
        pages.push(lastPage);
      } else if (current >= lastPage - 3) {
        pages.push(1);
        pages.push("ellipsis-start");
        for (let i = lastPage - 4; i <= lastPage; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis-start");
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push("ellipsis-end");
        pages.push(lastPage);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-xl ${className}`}>
      {showDetails && totalItems !== undefined && totalItems > 0 ? (
        <div className="text-xs sm:text-sm text-slate-500 order-2 sm:order-1 text-center sm:text-left">
          Showing <span className="font-semibold text-slate-900">{fromItem}</span> to{" "}
          <span className="font-semibold text-slate-900">{toItem}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalItems}</span> results
        </div>
      ) : (
        <div className="order-2 sm:order-1" />
      )}

      {showNav && (
        <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center">
          <PaginationRoot className="w-auto mx-0">
            <PaginationContent>
              {/* Previous Button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(current - 1)}
                  disabled={current <= 1}
                />
              </PaginationItem>

              {/* Numbered Page Buttons & Ellipses */}
              {pageNumbers.map((page, index) => {
                if (page === "ellipsis-start" || page === "ellipsis-end") {
                  return (
                    <PaginationItem key={`${page}-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === current}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Next Button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(current + 1)}
                  disabled={current >= lastPage}
                />
              </PaginationItem>
            </PaginationContent>
          </PaginationRoot>
        </div>
      )}
    </div>
  );
}

export {
  PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./shadcn-pagination";
