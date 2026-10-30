import { ChevronDown } from 'lucide-react';

// Form section: description on the left, a two-column field grid on the right.
// Every field is either one column (half width) or `full`, so edges always line up.
export const FormSection = ({ icon: Icon, title, description, children }) => (
    <section className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-x-12 gap-y-5 px-6 md:px-8 py-7 border-b border-line last:border-b-0">
        <div>
            {Icon && (
                <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                </span>
            )}
            <h2 className="text-base font-bold text-ink">{title}</h2>
            {description && <p className="text-[13px] text-muted mt-1 leading-relaxed">{description}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5 content-start max-w-3xl">
            {children}
        </div>
    </section>
);

// Labelled field. Use `full` to span both columns.
export const Field = ({ label, optional, icon: Icon, select, full, children }) => (
    <div className={full ? 'sm:col-span-2' : ''}>
        <label className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-1.5">
            {label}
            {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
        </label>
        <div className="relative [&>input]:h-11! [&>select]:h-11!">
            {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />}
            {children}
            {select && <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />}
        </div>
    </div>
);
