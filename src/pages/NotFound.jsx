import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8 relative">
                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl -z-10" />
                
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-9xl font-black text-secondary-900 tracking-tighter">
                        4<span className="text-primary-500">0</span>4
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-center gap-3 text-rose-500">
                        <AlertCircle className="w-8 h-8" />
                        <h2 className="text-3xl font-bold uppercase tracking-tight">Page Not Found</h2>
                    </div>
                    <p className="text-slate-500 max-w-md mx-auto text-lg">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
                >
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-8 py-4 bg-white text-secondary-900 border-2 border-secondary-900 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <Link
                        to="/login"
                        className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFound;
