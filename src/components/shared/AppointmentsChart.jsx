import { useMemo, useState } from 'react';
import { BarChart, Bar, Cell, LabelList, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getLocalDateString } from '../../utils/documentUtils';

// Plain bar chart: appointments per day for the past or the coming 7 days (today highlighted).
const AppointmentsChart = ({ appointments = [], height = 260, title = 'Appointments per day' }) => {
    const [range, setRange] = useState('past');
    const todayKey = getLocalDateString(new Date());

    const { data, total } = useMemo(() => {
        const days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + (range === 'past' ? i - 6 : i));
            return {
                key: getLocalDateString(d),
                name: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
                count: 0
            };
        });
        const byKey = Object.fromEntries(days.map(d => [d.key, d]));

        appointments.forEach(a => {
            const bucket = byKey[getLocalDateString(a.date || a.createdAt)];
            if (bucket) bucket.count += 1;
        });

        return { data: days, total: days.reduce((sum, d) => sum + d.count, 0) };
    }, [appointments, range]);

    return (
        <div className="ui-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-base font-bold text-ink">{title}</h3>
                    <p className="text-xs text-muted mt-0.5">
                        <span className="font-semibold text-ink tabular-nums">{total}</span> in the {range === 'past' ? 'last 7 days' : 'next 7 days'}
                    </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {[['past', 'Past 7 days'], ['next', 'Next 7 days']].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setRange(key)}
                            className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${range === key ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ height }} className="w-full relative">
                {total === 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted pointer-events-none">
                        No appointments in this period
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 18, right: 8, left: -24, bottom: 0 }} barCategoryGap="30%">
                        <CartesianGrid vertical={false} stroke="#e6e9f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#566074', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#8791a5', fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: '#f2f3f7' }}
                            formatter={(v) => [v, 'Appointments']}
                            contentStyle={{ borderRadius: 10, border: '1px solid #e6e9f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)', fontSize: 13 }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                            {data.map(d => <Cell key={d.key} fill={d.key === todayKey ? '#080c2e' : '#00baa9'} />)}
                            <LabelList dataKey="count" position="top" style={{ fill: '#0b1230', fontSize: 12, fontWeight: 600 }} formatter={(v) => (v > 0 ? v : '')} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AppointmentsChart;
