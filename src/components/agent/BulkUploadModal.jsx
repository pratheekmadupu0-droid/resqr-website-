import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Download, X, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateCsvRow, generateSampleCsvContent, CUSTOMER_CATEGORIES } from '../../lib/agentCategoriesConfig';
import { bulkEnrollGroupMembers } from '../../lib/agents';

export default function BulkUploadModal({ isOpen, onClose, group, agent, onComplete }) {
    const [csvFile, setCsvFile] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [parsedRows, setParsedRows] = useState([]);
    const [validRows, setValidRows] = useState([]);
    const [invalidRows, setInvalidRows] = useState([]);
    const [duplicateRows, setDuplicateRows] = useState([]);
    const fileInputRef = useRef(null);

    if (!isOpen || !group) return null;

    const categoryType = group.categoryType;
    const catConfig = CUSTOMER_CATEGORIES[categoryType] || {};

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
            toast.error('Please upload a valid .csv spreadsheet file.');
            return;
        }
        setCsvFile(file);
        parseCsv(file);
    };

    const parseCsv = (file) => {
        setParsing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result;
                if (!text || typeof text !== 'string') throw new Error('File is empty.');

                const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
                if (lines.length < 2) {
                    toast.error('CSV must contain a header row and at least one data row.');
                    setParsing(false);
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
                const rawRows = [];

                for (let i = 1; i < lines.length; i++) {
                    // Match commas while respecting quotes
                    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
                    const cleanValues = values.map(v => v.trim().replace(/^["']|["']$/g, ''));
                    const rowObj = {};
                    headers.forEach((h, idx) => {
                        rowObj[h] = cleanValues[idx] || '';
                    });
                    rawRows.push({ rowIndex: i, raw: rowObj });
                }

                const valids = [];
                const invalids = [];
                const duplicates = [];
                const seenPhones = new Set();

                rawRows.forEach(({ rowIndex, raw }) => {
                    const validation = validateCsvRow(raw, categoryType);
                    const norm = validation.normalizedData;

                    if (!validation.isValid) {
                        invalids.push({ rowIndex, data: norm, errors: validation.errors });
                    } else if (norm.phone && seenPhones.has(norm.phone)) {
                        duplicates.push({ rowIndex, data: norm, errors: ['Duplicate phone number in CSV batch'] });
                    } else {
                        if (norm.phone) seenPhones.add(norm.phone);
                        valids.push({ rowIndex, data: norm });
                    }
                });

                setParsedRows(rawRows);
                setValidRows(valids);
                setInvalidRows(invalids);
                setDuplicateRows(duplicates);
            } catch (err) {
                console.error('CSV parse error:', err);
                toast.error('Failed to parse CSV: ' + err.message);
            } finally {
                setParsing(false);
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const content = generateSampleCsvContent(categoryType);
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `RESQR_${categoryType}_Bulk_Template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Sample template downloaded.');
    };

    const handleDownloadErrorReport = () => {
        if (invalidRows.length === 0 && duplicateRows.length === 0) {
            toast.error('No errors found to download.');
            return;
        }

        let report = 'Row,Name,Phone,Class_Or_Department,Errors\n';
        [...invalidRows, ...duplicateRows].forEach((item) => {
            const errStr = item.errors.join('; ').replace(/"/g, '""');
            report += `${item.rowIndex},"${item.data.name || ''}","${item.data.phone || ''}","${item.data.divisionOrDept || ''}","${errStr}"\n`;
        });

        const blob = new Blob([report], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `RESQR_${group.groupId}_Error_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Error report downloaded.');
    };

    const handleBulkSubmit = async () => {
        if (validRows.length === 0) {
            toast.error('No valid records to enroll.');
            return;
        }

        setSubmitting(true);
        const t = toast.loading(`Enrolling ${validRows.length} members for ${group.name || group.groupId}...`);

        try {
            const payload = validRows.map(v => v.data);
            const result = await bulkEnrollGroupMembers(agent, group.groupId, categoryType, payload);
            toast.success(`Successfully registered ${result.enrolledCount} members for ${group.groupId}!`, { id: t, duration: 5000 });
            if (onComplete) onComplete(result);
            onClose();
        } catch (err) {
            console.error('Bulk enrollment failed:', err);
            toast.error(err.message || 'Bulk enrollment failed.', { id: t });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-[#090E1A] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                            Bulk Enrollment Engine
                        </div>
                        <h2 className="text-2xl font-black italic uppercase font-poppins text-white">
                            Upload {catConfig.memberNoun || 'Member'} Directory
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                            Group: <span className="text-white font-bold">{group.institutionName || group.companyName || group.familyName || group.name}</span> ({group.groupId})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-6 mt-6">
                    {/* Action Bar / Template Download */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <FileText className="text-primary shrink-0" size={24} />
                            <div>
                                <p className="text-xs font-bold text-white">Need the correct column format?</p>
                                <p className="text-[11px] text-slate-400">Download the pre-formatted CSV template with example rows.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="btn-app-secondary py-2 px-4 text-xs inline-flex items-center gap-2 shrink-0 font-bold"
                        >
                            <Download size={14} /> Download Sample CSV
                        </button>
                    </div>

                    {/* Upload Dropzone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                            csvFile ? 'border-primary/50 bg-primary/5' : 'border-white/15 bg-[#050914] hover:border-white/30'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-primary flex items-center justify-center mx-auto mb-3">
                            <Upload size={24} />
                        </div>
                        {csvFile ? (
                            <div>
                                <p className="text-sm font-bold text-white">{csvFile.name}</p>
                                <p className="text-xs text-slate-400 mt-1">{(csvFile.size / 1024).toFixed(1)} KB · Click to change file</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-bold text-white">Drop your .csv file here or click to browse</p>
                                <p className="text-xs text-slate-400 mt-1">Supports UTF-8 CSV exports from Excel, Google Sheets, or School ERPs</p>
                            </div>
                        )}
                    </div>

                    {/* Parsing Spinner */}
                    {parsing && (
                        <div className="flex items-center justify-center gap-3 py-6 text-slate-400 text-xs">
                            <Loader2 className="animate-spin text-primary" size={20} />
                            <span>Validating and inspecting CSV records...</span>
                        </div>
                    )}

                    {/* Analysis Summary Cards */}
                    {parsedRows.length > 0 && !parsing && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Rows</p>
                                    <p className="text-xl font-bold text-white mt-1">{parsedRows.length}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <p className="text-[10px] font-black uppercase tracking-wider">Valid Records</p>
                                    <p className="text-xl font-bold mt-1">{validRows.length}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                    <p className="text-[10px] font-black uppercase tracking-wider">Invalid Rows</p>
                                    <p className="text-xl font-bold mt-1">{invalidRows.length}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                    <p className="text-[10px] font-black uppercase tracking-wider">Duplicates</p>
                                    <p className="text-xl font-bold mt-1">{duplicateRows.length}</p>
                                </div>
                            </div>

                            {/* Error Warning & Download Error Report */}
                            {(invalidRows.length > 0 || duplicateRows.length > 0) && (
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                                        <AlertTriangle size={18} className="shrink-0" />
                                        <span>
                                            {invalidRows.length + duplicateRows.length} rows have formatting or duplication errors and will be skipped.
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDownloadErrorReport}
                                        className="btn-app-secondary py-1.5 px-3 text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0 text-rose-300 border-rose-500/30"
                                    >
                                        <Download size={12} /> Download Error Report
                                    </button>
                                </div>
                            )}

                            {/* Preview Table */}
                            <div className="rounded-2xl border border-white/10 bg-[#050914] overflow-hidden max-h-56 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-[#090E1A] border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Dept / Class</th>
                                            <th className="p-3">Phone</th>
                                            <th className="p-3">Emergency Contact</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {validRows.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="hover:bg-white/5 text-slate-200">
                                                <td className="p-3">
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                                                        <CheckCircle2 size={12} /> Valid
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold text-white">{row.data.name}</td>
                                                <td className="p-3 text-slate-400">{row.data.divisionOrDept || '—'}</td>
                                                <td className="p-3 font-mono text-slate-400">{row.data.phone || '—'}</td>
                                                <td className="p-3 font-mono text-slate-400">{row.data.emergencyContact || '—'}</td>
                                            </tr>
                                        ))}
                                        {invalidRows.slice(0, 3).map((row, i) => (
                                            <tr key={`inv-${i}`} className="bg-rose-500/5 text-rose-300">
                                                <td className="p-3">
                                                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[10px]">
                                                        <AlertTriangle size={12} /> Error
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold">{row.data.name || 'Missing Name'}</td>
                                                <td className="p-3">{row.data.divisionOrDept || '—'}</td>
                                                <td className="p-3 font-mono">{row.data.phone || '—'}</td>
                                                <td className="p-3 text-[10px] text-rose-400">{row.errors.join(', ')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="btn-app-secondary py-3 px-6 text-xs font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleBulkSubmit}
                        disabled={submitting || validRows.length === 0}
                        className="btn-app-primary py-3 px-8 text-xs font-bold inline-flex items-center gap-2 shadow-xl shadow-primary/20"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Enrolling {validRows.length} Members...
                            </>
                        ) : (
                            <>
                                Enroll {validRows.length} Valid Members <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
