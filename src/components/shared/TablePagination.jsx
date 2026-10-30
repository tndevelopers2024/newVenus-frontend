import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown
} from 'lucide-react';

const TablePagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange
}) => {
    if (totalItems === 0) return null;

    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const pageSizeOptions = [5, 10, 25, 50, 100];

    return (
        <div className="px-5 py-3.5 border-t border-line bg-white flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Items per page */}
            <div className="flex items-center gap-3">
                <span className="text-[13px] text-muted">
                    Rows per page
                </span>
                <div className="relative group">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="appearance-none bg-white border border-line rounded-lg h-9 pl-3 pr-9 text-[13px] font-semibold text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-400/15 transition-all cursor-pointer hover:border-slate-200"
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle pointer-events-none group-focus-within:text-primary-500 transition-colors" />
                </div>
            </div>

            {/* Center: Range Indicator */}
            <div className="flex items-center">
                <p className="text-[13px] text-muted tabular-nums">
                    Showing <span className="text-ink font-semibold">{startItem}</span> – <span className="text-ink font-semibold">{endItem}</span> of <span className="text-ink font-semibold">{totalItems}</span> items
                </p>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-line">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all group"
                        title="First Page"
                    >
                        <ChevronsLeft className="w-4 h-4 text-muted group-hover:text-primary-600" />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all group"
                        title="Previous Page"
                    >
                        <ChevronLeft className="w-4 h-4 text-muted group-hover:text-primary-600" />
                    </button>
                </div>

                <div className="px-3.5 h-9 flex items-center bg-secondary-900 rounded-lg">
                    <p className="text-[13px] font-semibold text-white whitespace-nowrap tabular-nums">
                        Page <span className="text-primary-400">{currentPage}</span> of {totalPages || 1}
                    </p>
                </div>

                <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-line">
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all group"
                        title="Next Page"
                    >
                        <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary-600" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all group"
                        title="Last Page"
                    >
                        <ChevronsRight className="w-4 h-4 text-muted group-hover:text-primary-600" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TablePagination;
