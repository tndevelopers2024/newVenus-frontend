import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarDatePicker = ({ value, onChange, label = "Select Date" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date()); // For navigation
    const containerRef = useRef(null);

    // Parse value if it exists
    const selectedDate = value ? new Date(value) : null;

    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(selectedDate);
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleSelect = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Format to YYYY-MM-DD for consistency with input type="date"
        const formatted = newDate.toISOString().split('T')[0];
        onChange(formatted);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        const formatted = today.toISOString().split('T')[0];
        onChange(formatted);
        setCurrentDate(today);
        setIsOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const renderCalendarDays = () => {
        const days = [];
        const daysCount = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        // Empty slots for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
        }

        // Days
        for (let i = 1; i <= daysCount; i++) {
            const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const isSelected = selectedDate &&
                dateToCheck.getDate() === selectedDate.getDate() &&
                dateToCheck.getMonth() === selectedDate.getMonth() &&
                dateToCheck.getFullYear() === selectedDate.getFullYear();

            const isToday = new Date().toDateString() === dateToCheck.toDateString();

            days.push(
                <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all
                        ${isSelected
                            ? 'bg-[#00ddcb] text-white shadow-lg shadow-teal-500/30'
                            : isToday
                                ? 'bg-slate-100 text-secondary-900 border border-slate-200'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-secondary-900'
                        }`}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 rounded-xl pl-10 pr-3 py-3 text-sm font-bold flex items-center justify-between cursor-pointer transition-all border ${isOpen ? 'ring-2 ring-emerald-500/20 border-emerald-500/20' : 'border-transparent hover:border-slate-200'}`}
            >
                <div className="flex items-center">
                    <CalendarIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${value ? 'text-[#00ddcb]' : 'text-slate-400'}`} />
                    <span className={value ? 'text-secondary-900' : 'text-slate-400'}>
                        {value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : label}
                    </span>
                </div>
                {value && (
                    <button
                        onClick={handleClear}
                        className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-slate-400" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-[300px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-black text-secondary-900 uppercase tracking-widest">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h4>
                            <div className="flex gap-2">
                                <button onClick={prevMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-secondary-900 transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={nextMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-secondary-900 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-wider py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-y-2 place-items-center">
                            {renderCalendarDays()}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                            <button
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleToday}
                                className="text-[10px] font-bold text-[#00ddcb] hover:text-[#00c4b4] transition-colors uppercase tracking-widest"
                            >
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarDatePicker;
