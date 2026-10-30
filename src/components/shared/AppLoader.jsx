// Branded loader: New Venus Clinic logo with a soft pulse and a sliding progress bar.
const AppLoader = ({ fullScreen = true, label = 'Loading' }) => (
    <div className={`flex flex-col items-center justify-center bg-slate-50 ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
        <img
            src="/images/venus-logo.webp"
            alt="New Venus Clinic"
            className="w-52 md:w-60 h-auto object-contain venus-loader-logo"
        />
        <div className="mt-7 w-44 h-1 rounded-full bg-primary-100 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-primary-500 venus-loader-bar" />
        </div>
        <p className="mt-3 text-xs font-medium tracking-wide text-muted">{label}...</p>
    </div>
);

export default AppLoader;
