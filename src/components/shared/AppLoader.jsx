import { createPortal } from 'react-dom';

// Branded loader: New Venus Clinic logo with a soft pulse and a sliding progress bar.
// `compact` is used while a page's data loads: it fades the whole page behind a
// full-screen overlay (portaled to <body>) so no partial content shows through.
const AppLoader = ({ fullScreen = true, compact = false, label = 'Loading' }) => {
    const content = (
        <>
            <img
                src="/images/venus-logo.webp"
                alt="New Venus Clinic"
                className="w-44 md:w-56 h-auto object-contain venus-loader-logo"
            />
            <div className="mt-7 w-44 h-1 rounded-full bg-primary-100 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-primary-500 venus-loader-bar" />
            </div>
            <p className="mt-3 text-xs font-medium tracking-wide text-muted">{label}...</p>
        </>
    );

    if (compact) {
        return createPortal(
            <div
                role="status"
                aria-live="polite"
                className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
            >
                {content}
            </div>,
            document.body
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center bg-slate-50 ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
            {content}
        </div>
    );
};

export default AppLoader;
