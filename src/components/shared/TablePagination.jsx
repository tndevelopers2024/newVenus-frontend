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
        <div className="px-8 py-5 border-t border-slate-100/50 bg-white/50 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Items per page */}
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Items per page
                </span>
                <div className="relative group">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="appearance-none bg-white border border-slate-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-black text-secondary-900 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-400/10 transition-all cursor-pointer shadow-sm hover:border-slate-200"
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-focus-within:text-primary-500 transition-colors" />
                </div>
            </div>

            {/* Center: Range Indicator */}
            <div className="flex items-center px-6 py-2 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Showing <span className="text-secondary-900 font-black">{startItem}</span> - <span className="text-secondary-900 font-black">{endItem}</span> of <span className="text-secondary-900 font-black">{totalItems}</span> items
                </p>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-20 disabled:hover:bg-transparent transition-all group"
                        title="First Page"
                    >
                        <ChevronsLeft className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-20 disabled:hover:bg-transparent transition-all group"
                        title="Previous Page"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                    </button>
                </div>

                <div className="px-4 py-2 bg-secondary-900 rounded-xl shadow-lg shadow-secondary-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
                        Page <span className="text-primary-400">{currentPage}</span> of {totalPages || 1}
                    </p>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-20 disabled:hover:bg-transparent transition-all group"
                        title="Next Page"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-20 disabled:hover:bg-transparent transition-all group"
                        title="Last Page"
                    >
                        <ChevronsRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TablePagination;
