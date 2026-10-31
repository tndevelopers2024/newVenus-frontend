import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Phone, Mail, MapPin, Droplet, CalendarDays, Stethoscope, Pill, FileText, Receipt, Activity, ChevronDown } from 'lucide-react';
import { doctorApi } from '../../services/api';
import { formatMedicationDuration } from '../../utils/documentUtils';
import AppLoader from './AppLoader';

const fmtDate = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
    d ? new Date(d).toLocaleDateString('en-GB', opts) : '–';

const statusClass = (s) =>
    s === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        s === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' :
            s === 'Accepted' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                'bg-amber-50 text-amber-700 border-amber-200';

const initialsOf = (name) =>
    (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// Read-only visit history for a patient (admin Patients list).
const PatientHistoryDrawer = ({ patientId, onClose }) => {
    const [openId, setOpenId] = useState(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['patientHistoryView', patientId],
        queryFn: async () => (await doctorApi.getPatientHistory(patientId)).data,
        enabled: !!patientId,
    });

    const patient = data?.patient;

    const visits = useMemo(() => {
        const prescriptions = data?.prescriptions || [];
        const invoices = data?.invoices || [];
        return [...(data?.appointments || [])]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(appt => ({
                appt,
                rx: prescriptions.find(p => String(p.appointment?._id || p.appointment) === String(appt._id)),
                invoice: invoices.find(i => String(i.appointment?._id || i.appointment) === String(appt._id)),
            }));
    }, [data]);

    const completed = visits.filter(v => v.appt.status === 'Completed').length;
    const lastVisit = visits.find(v => v.appt.status === 'Completed')?.appt.date;

    const vitalsOf = (v) => [
        ['BP', v?.bloodPressure, 'mmHg'], ['Pulse', v?.pulse, 'bpm'], ['SpO2', v?.spo2, '%'],
        ['Temp', v?.temperature, '°F'], ['Weight', v?.weight, 'Kg'],
    ].filter(x => x[1]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full">
                <div className="px-6 py-4 border-b border-line flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-11 h-11 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                            {initialsOf(patient?.name)}
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-ink leading-tight truncate">{patient?.name || 'Patient history'}</h3>
                            <p className="text-xs text-muted">
                                {patient?.displayId ? `#${patient.displayId}` : 'Patient record'}
                                {patient?.age ? ` · ${patient.age} yrs` : ''}{patient?.gender ? ` · ${patient.gender}` : ''}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="ui-icon-btn shrink-0" title="Close"><X className="w-5 h-5" /></button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center"><AppLoader fullScreen={false} label="Loading patient history" /></div>
                ) : isError || !data ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted p-6">Could not load this patient's history.</div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/60">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                [CalendarDays, 'Total visits', visits.length],
                                [Activity, 'Completed', completed],
                                [Pill, 'Prescriptions', data.prescriptions?.length || 0],
                                [FileText, 'Last visit', lastVisit ? fmtDate(lastVisit) : '–'],
                            ].map(([Icon, label, value]) => (
                                <div key={label} className="ui-card p-3.5">
                                    <p className="text-xs text-muted flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-subtle" />{label}</p>
                                    <p className="text-lg font-bold text-ink mt-1 tabular-nums">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="ui-card p-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                            <p className="flex items-center gap-2 text-ink"><Phone className="w-3.5 h-3.5 text-subtle" />{patient?.phone || '–'}</p>
                            <p className="flex items-center gap-2 text-ink min-w-0"><Mail className="w-3.5 h-3.5 text-subtle shrink-0" /><span className="truncate">{patient?.email || '–'}</span></p>
                            <p className="flex items-center gap-2 text-ink"><Droplet className="w-3.5 h-3.5 text-subtle" />Blood group: {patient?.bloodGroup || '–'}</p>
                            <p className="flex items-center gap-2 text-ink"><CalendarDays className="w-3.5 h-3.5 text-subtle" />Registered: {fmtDate(patient?.createdAt)}</p>
                            {patient?.address && <p className="flex items-start gap-2 text-ink sm:col-span-2"><MapPin className="w-3.5 h-3.5 text-subtle mt-0.5" />{patient.address}</p>}
                        </div>

                        <div>
                            <h4 className="label-caps mb-3">Visit history</h4>
                            {visits.length === 0 ? (
                                <div className="ui-card py-12 text-center text-sm text-muted">No visits recorded for this patient yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {visits.map(({ appt, rx, invoice }) => {
                                        const isOpen = openId === appt._id;
                                        const vitals = vitalsOf(appt.vitals);
                                        return (
                                            <div key={appt._id} className="ui-card overflow-hidden">
                                                <button type="button" onClick={() => setOpenId(isOpen ? null : appt._id)} className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50/70">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-ink">{fmtDate(appt.date, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                        <p className="text-[13px] text-muted mt-0.5 truncate">
                                                            <Stethoscope className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-subtle" />
                                                            {appt.doctor?.name ? `Dr. ${appt.doctor.name.replace(/^dr\.?\s*/i, '')}` : 'Doctor N/A'}
                                                            {appt.reason ? ` · ${appt.reason}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className={`ui-chip ${statusClass(appt.status)}`}>{appt.status}</span>
                                                    <ChevronDown className={`w-4 h-4 text-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isOpen && (
                                                    <div className="border-t border-line p-4 space-y-4 text-sm">
                                                        {vitals.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {vitals.map(([l, val, u]) => (
                                                                    <span key={l} className="ui-chip bg-slate-50 text-ink border-line">{l}: <b className="ml-1">{val}</b><span className="text-subtle ml-0.5">{u}</span></span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {(appt.diagnosis || appt.clinicalNotes) && (
                                                            <div className="grid sm:grid-cols-2 gap-3">
                                                                <div><p className="label-caps mb-1">Chief complaints</p><p className="text-ink whitespace-pre-wrap">{appt.diagnosis || '–'}</p></div>
                                                                <div><p className="label-caps mb-1">Clinical findings</p><p className="text-ink whitespace-pre-wrap">{appt.clinicalNotes || '–'}</p></div>
                                                            </div>
                                                        )}
                                                        {rx?.medications?.length > 0 && (
                                                            <div>
                                                                <p className="label-caps mb-1.5">Medicines prescribed</p>
                                                                <div className="rounded-lg border border-line divide-y divide-line">
                                                                    {rx.medications.map((m, i) => (
                                                                        <div key={i} className="px-3 py-2 flex items-start justify-between gap-3">
                                                                            <span className="font-semibold text-ink uppercase">{i + 1}) {m.name}</span>
                                                                            <span className="text-muted text-[13px] text-right shrink-0">
                                                                                {m.frequency}{m.unit && m.unit !== '-' ? ` ${m.unit}` : ''} · {formatMedicationDuration(m.duration, m.durationUnit)} · {m.instruction || 'After Food'}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {rx?.image && !rx?.medications?.length && (
                                                            <p className="text-muted flex items-center gap-2"><FileText className="w-4 h-4" />Handwritten prescription on file.</p>
                                                        )}
                                                        {rx?.notes && (
                                                            <div><p className="label-caps mb-1">Instructions / remarks</p><p className="text-ink whitespace-pre-wrap">{rx.notes}</p></div>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted">
                                                            {rx?.followUpDate && <span>Follow-up: <b className="text-ink">{fmtDate(rx.followUpDate)}</b></span>}
                                                            {invoice && <span className="inline-flex items-center gap-1"><Receipt className="w-3.5 h-3.5" />Payment: <b className="text-ink">{invoice.status || '–'}</b>{invoice.totalAmount != null ? ` · ₹${invoice.totalAmount}` : ''}</span>}
                                                        </div>
                                                        {!vitals.length && !appt.diagnosis && !appt.clinicalNotes && !rx && (
                                                            <p className="text-muted">No clinical details were recorded for this visit.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientHistoryDrawer;
