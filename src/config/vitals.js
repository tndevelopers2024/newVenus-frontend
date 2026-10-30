import { Activity, Thermometer, HeartPulse, Weight, Droplets } from 'lucide-react';

// Shared look for the five vitals (used by the appointment popup and the consultation page).
// Class strings are written out in full so Tailwind can detect them.
export const VITALS_META = {
    bloodPressure: {
        label: 'BP', unit: 'mmHg', placeholder: 'xxx/xx', icon: Activity, required: true,
        card: 'bg-rose-50 border-rose-200 focus-within:border-rose-400', iconBox: 'bg-rose-100 text-rose-600', label_: 'text-rose-700'
    },
    temperature: {
        label: 'Temp', unit: '°F', placeholder: 'xx.x', icon: Thermometer,
        card: 'bg-amber-50 border-amber-200 focus-within:border-amber-400', iconBox: 'bg-amber-100 text-amber-600', label_: 'text-amber-700'
    },
    pulse: {
        label: 'Pulse', unit: 'bpm', placeholder: 'xx', icon: HeartPulse, required: true,
        card: 'bg-violet-50 border-violet-200 focus-within:border-violet-400', iconBox: 'bg-violet-100 text-violet-600', label_: 'text-violet-700'
    },
    weight: {
        label: 'Weight', unit: 'kg', placeholder: 'xx', icon: Weight,
        card: 'bg-sky-50 border-sky-200 focus-within:border-sky-400', iconBox: 'bg-sky-100 text-sky-600', label_: 'text-sky-700'
    },
    spo2: {
        label: 'SpO2', unit: '%', placeholder: 'xx', icon: Droplets,
        card: 'bg-teal-50 border-teal-200 focus-within:border-teal-400', iconBox: 'bg-teal-100 text-teal-600', label_: 'text-teal-700'
    }
};
