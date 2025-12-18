
import React, { useState, useMemo } from 'react';
import { User, Complaint, Role, Status, UserView, AdminView, Badge, Language } from '../types';
import ComplaintForm from './ComplaintForm';
import { generateChartAnalysis, generateComprehensiveReport } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getTranslation } from '../translations';

interface ComplaintCardProps {
  complaint: Complaint;
  currentUser: User;
  onUpdateStatus: (complaintId: number, status: Status) => void;
  onDelete?: (complaintId: number) => void;
  onRestore?: (complaintId: number) => void;
  onPermanentDelete?: (complaintId: number) => void;
  users: User[];
  onVote?: (complaintId: number) => void;
  isModal?: boolean;
  onVerify?: (complaintId: number) => void;
  onAdminVerify?: (complaintId: number, status: 'Verified' | 'Spam') => void;
  onClick?: () => void;
  language?: Language;
}

const statusColorMap = {
  [Status.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-500',
  [Status.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-500',
  [Status.RESOLVED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-500',
};

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, currentUser, onUpdateStatus, onDelete, onRestore, onPermanentDelete, users, onVote, isModal, onVerify, onAdminVerify, onClick, language = 'English' as Language }) => {
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerifyClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if(onVerify) {
            setIsVerifying(true);
            await onVerify(complaint.id);
            setIsVerifying(false);
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) onDelete(complaint.id);
    }
    
    const handleRestore = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRestore) onRestore(complaint.id);
    }

    const handlePermanentDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onPermanentDelete && window.confirm(getTranslation(language, 'confirmPermanentDelete'))) {
            onPermanentDelete(complaint.id);
        }
    }
    
    const handleVoteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if(onVote) onVote(complaint.id);
    }
    
    const handleUpdateStatusClick = (e: React.MouseEvent, status: Status) => {
        e.preventDefault();
        e.stopPropagation();
        onUpdateStatus(complaint.id, status);
    }

    const handleAdminAction = (e: React.MouseEvent, status: 'Verified' | 'Spam') => {
        e.preventDefault();
        e.stopPropagation();
        if (onAdminVerify) onAdminVerify(complaint.id, status);
    }

    const getStatusText = (status: Status) => {
        if (status === Status.PENDING) return getTranslation(language, 'statusPending');
        if (status === Status.IN_PROGRESS) return getTranslation(language, 'statusInProgress');
        if (status === Status.RESOLVED) return getTranslation(language, 'statusResolved');
        return status;
    };
    
    const authStatus = complaint.authenticityStatus || 'Unverified';
    const isAiChecked = authStatus === 'Likely Authentic' || authStatus === 'Potential Spam';
    const isVerified = authStatus === 'Verified';
    const isSpam = authStatus === 'Spam';

    if (complaint.deletedAt && currentUser.role === Role.ADMIN) {
        return (
            <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 border-l-4 border-gray-500 transition-all duration-300 h-full flex flex-col relative opacity-80`}>
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 break-words">{complaint.location} (Deleted)</h3>
                    <p className="text-sm text-red-500">Deleted: {complaint.deletedAt.toLocaleDateString()}</p>
                 </div>
                 <p className="text-gray-600 dark:text-gray-400 mt-2 flex-grow">{complaint.description}</p>
                 <div className="mt-4 flex gap-4 relative z-20">
                     {onRestore && (
                        <button onClick={handleRestore} className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
                            {getTranslation(language, 'restore')}
                        </button>
                     )}
                     {onPermanentDelete && (
                        <button onClick={handlePermanentDelete} className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">
                             {getTranslation(language, 'deleteForever')}
                        </button>
                     )}
                 </div>
            </div>
        )
    }
    
    return (
        <div 
            onClick={onClick}
            className={`bg-white dark:bg-gray-800 rounded-lg ${!isModal ? 'shadow-md p-6 border-l-4 hover:border-l-8' : 'p-6'} ${statusColorMap[complaint.status]} transition-all duration-300 h-full flex flex-col relative ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}
        >
             <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white break-words">{complaint.location}</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {complaint.userName} • {complaint.createdAt.toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap items-center">
                        {complaint.isPublic && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full font-medium">Public</span>}
                        
                        {currentUser.role === Role.ADMIN && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isVerified ? 'bg-green-600 text-white' : 
                                isSpam ? 'bg-red-600 text-white' :
                                authStatus === 'Likely Authentic' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                authStatus === 'Potential Spam' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                                {isVerified ? getTranslation(language, 'statusVerified') :
                                 isSpam ? getTranslation(language, 'statusSpam') :
                                 authStatus}
                            </span>
                        )}
                         <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${statusColorMap[complaint.status].split(' ')[0]} ${statusColorMap[complaint.status].split(' ')[1]}`}>
                            {getStatusText(complaint.status)}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end space-y-2 shrink-0 ml-2">
                    {complaint.isPublic && onVote && currentUser.role === Role.USER && complaint.status !== Status.RESOLVED && (
                         <button 
                            onClick={handleVoteClick}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors text-gray-600 dark:text-gray-300 shadow-sm relative z-20"
                            title="Upvote this complaint"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                             <span className="font-bold">{complaint.votes}</span>
                         </button>
                    )}
                </div>
            </div>
            <p className="mt-4 text-gray-700 dark:text-gray-300 flex-grow whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
            {complaint.imageUrl && <img src={complaint.imageUrl} alt="Complaint" className="mt-4 rounded-lg w-full object-contain bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" style={{ maxHeight: '50vh' }} />}
            
            {complaint.resolvedAt && (
                <div className="mt-4 flex items-center text-green-600 dark:text-green-400 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Resolved on: {complaint.resolvedAt.toLocaleDateString()}
                </div>
            )}

             {currentUser.role === Role.ADMIN && (
                 <div className="mt-6 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                     <div className="flex flex-col gap-2">
                         {onVerify && onAdminVerify && !isVerified && !isSpam && (
                             <div className="flex gap-2 w-full relative z-20">
                                 {!isAiChecked ? (
                                     <button 
                                        onClick={handleVerifyClick} 
                                        disabled={isVerifying}
                                        className={`flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 shadow-sm flex justify-center items-center transition-colors disabled:opacity-70`}
                                     >
                                        {isVerifying ? 'Checking...' : getTranslation(language, 'checkAuthenticity')}
                                     </button>
                                 ) : (
                                     <>
                                        <button 
                                            onClick={(e) => handleAdminAction(e, 'Verified')}
                                            className="flex-1 px-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 shadow-sm flex items-center justify-center gap-1 transition-colors"
                                        >
                                            {getTranslation(language, 'adminVerify')}
                                        </button>
                                        <button 
                                            onClick={(e) => handleAdminAction(e, 'Spam')}
                                            className="flex-1 px-3 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 shadow-sm flex items-center justify-center gap-1 transition-colors"
                                        >
                                            {getTranslation(language, 'adminReject')}
                                        </button>
                                     </>
                                 )}
                             </div>
                         )}

                         <div className="flex flex-wrap gap-2 relative z-20">
                            {complaint.status === Status.PENDING && (
                                <button onClick={(e) => handleUpdateStatusClick(e, Status.IN_PROGRESS)} className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 shadow-sm transition-colors">
                                    Start Progress
                                </button>
                            )}
                            {complaint.status !== Status.RESOLVED && (
                                <button onClick={(e) => handleUpdateStatusClick(e, Status.RESOLVED)} className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 shadow-sm transition-colors">
                                    Mark as Resolved
                                </button>
                            )}
                             {onDelete && (
                                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 shadow-sm flex justify-center items-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="ml-2 hidden sm:inline">{getTranslation(language, 'delete')}</span>
                                </button>
                             )}
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

const CompactComplaintCard: React.FC<{ complaint: Complaint; onClick: () => void; language: Language }> = ({ complaint, onClick, language }) => {
    const getStatusText = (status: Status) => {
        if (status === Status.PENDING) return getTranslation(language, 'statusPending');
        if (status === Status.IN_PROGRESS) return getTranslation(language, 'statusInProgress');
        if (status === Status.RESOLVED) return getTranslation(language, 'statusResolved');
        return status;
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-w-[280px] h-auto min-h-[9rem] border-l-4 ${statusColorMap[complaint.status]}`}
        >
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-1 max-w-[70%]">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <h4 className="font-bold text-gray-800 dark:text-white truncate text-sm">{complaint.location}</h4>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColorMap[complaint.status].split(' ')[0]} ${statusColorMap[complaint.status].split(' ')[1]}`}>
                        {getStatusText(complaint.status)}
                    </span>
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {complaint.createdAt.toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-2">{complaint.description}</p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                 {complaint.isPublic && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span className="font-semibold">{complaint.votes}</span>
                    </div>
                )}
                <span className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline">View Details</span>
            </div>
        </div>
    );
};

const ComplaintModal: React.FC<{ complaint: Complaint | null; onClose: () => void; children: React.ReactNode }> = ({ complaint, onClose, children }) => {
    if (!complaint) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                        <button onClick={onClose} className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6 sm:p-8">{children}</div>
                </div>
            </div>
        </div>
    );
};

const AdminReportsView: React.FC<{ complaints: Complaint[]; language: Language }> = ({ complaints, language }) => {
    const [filters, setFilters] = useState({ year: 'all', month: 'all' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportSummaries, setReportSummaries] = useState({ status: '', volume: '' });
    const [fullReport, setFullReport] = useState<string>('');
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);

    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            const yearMatch = filters.year === 'all' || c.createdAt.getFullYear() === parseInt(filters.year);
            const monthMatch = filters.month === 'all' || c.createdAt.getMonth() === parseInt(filters.month);
            return yearMatch && monthMatch && !c.deletedAt;
        });
    }, [filters, complaints]);

    const analyticsMetrics = useMemo(() => {
        const resolvedComplaints = filteredComplaints.filter(c => c.status === Status.RESOLVED && c.resolvedAt);
        const totalResolved = resolvedComplaints.length;
        const total = filteredComplaints.length;
        
        let totalResolutionTime = 0;
        resolvedComplaints.forEach(c => {
            if (c.resolvedAt) totalResolutionTime += (c.resolvedAt.getTime() - c.createdAt.getTime());
        });

        const avgResolutionTimeHours = totalResolved > 0 ? (totalResolutionTime / totalResolved) / (1000 * 60 * 60) : 0;
        const avgResolutionTimeDays = (avgResolutionTimeHours / 24).toFixed(1);
        const resolutionRate = total > 0 ? Math.round((totalResolved / total) * 100) : 0;

        return { avgResolutionTimeDays, resolutionRate, total };
    }, [filteredComplaints]);

    const handleGenerateReportSummary = async (chartType: 'status' | 'volume', data: any[]) => {
        setIsGenerating(true);
        setReportSummaries(prev => ({ ...prev, [chartType]: 'Generating summary...' }));
        try {
            const analysisText = await generateChartAnalysis(chartType, data, filters);
            setReportSummaries(prev => ({ ...prev, [chartType]: analysisText }));
        } catch (error) {
            setReportSummaries(prev => ({ ...prev, [chartType]: 'Error: Could not generate summary.' }));
        } finally {
            setIsGenerating(false);
        }
    };

    const statusData = useMemo(() => Object.values(Status).map(status => ({
        name: status,
        value: filteredComplaints.filter(c => c.status === status).length,
    })).filter(item => item.value > 0), [filteredComplaints]);

    const COLORS = { [Status.RESOLVED]: '#10B981', [Status.IN_PROGRESS]: '#3B82F6', [Status.PENDING]: '#F59E0B' };
    
    const barChartData = useMemo(() => {
        const complaintsByMonth = filteredComplaints.reduce((acc, c) => {
            const month = c.createdAt.toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.keys(complaintsByMonth).map(month => ({ month, Complaints: complaintsByMonth[month] }));
    }, [filteredComplaints]);

    const handleGenerateFullReport = async () => {
        setIsGeneratingFull(true);
        try {
            const report = await generateComprehensiveReport(analyticsMetrics, statusData, barChartData, filters);
            setFullReport(report);
        } catch (error) {
            alert("Failed to generate report.");
        } finally {
            setIsGeneratingFull(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reports & Analytics</h2>
                <button 
                    onClick={handleGenerateFullReport}
                    disabled={isGeneratingFull || filteredComplaints.length === 0}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                    {isGeneratingFull ? 'Generating...' : getTranslation(language, 'generateFullReport')}
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center border border-gray-100 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Filter Period:</span>
                <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="all">All Years</option>
                    {[...new Set(complaints.map(c => c.createdAt.getFullYear()))].map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="all">All Months</option>
                    {Array.from({length: 12}, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
            </div>

            {fullReport && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500 mb-8 animate-fadeIn">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{getTranslation(language, 'reportGenerated')}</h3>
                        <button onClick={() => setFullReport('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        <pre className="whitespace-pre-wrap font-sans text-sm">{fullReport}</pre>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{getTranslation(language, 'avgResolutionTime')}</h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{analyticsMetrics.avgResolutionTimeDays}</span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">days</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{getTranslation(language, 'resolutionRate')}</h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{analyticsMetrics.resolutionRate}%</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{getTranslation(language, 'totalComplaints')}</h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{analyticsMetrics.total}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-white">Complaints by Status</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         {statusData.length > 0 ? (
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                     {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name as Status]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                         ) : <p className="text-center text-gray-500 pt-16">No data for this filter.</p>}
                     </ResponsiveContainer>
                     <div className="text-center mt-4">
                        <button onClick={() => handleGenerateReportSummary('status', statusData)} disabled={isGenerating || statusData.length === 0} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50">
                            {isGenerating ? 'Generating...' : 'Generate AI Summary'}
                        </button>
                     </div>
                     {reportSummaries.status && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700 animate-fadeIn">
                            <h4 className="font-bold mb-2 text-gray-800 dark:text-white">AI Analysis</h4>
                            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{reportSummaries.status}</p>
                        </div>
                     )}
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-white">Monthly Complaint Volume</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         {barChartData.length > 0 ? (
                            <BarChart data={barChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="month" stroke="#9CA3AF" />
                                <YAxis allowDecimals={false} stroke="#9CA3AF" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Legend />
                                <Bar dataKey="Complaints" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          ) : <p className="text-center text-gray-500 pt-16">No data for this filter.</p>}
                     </ResponsiveContainer>
                      <div className="text-center mt-4">
                        <button onClick={() => handleGenerateReportSummary('volume', barChartData)} disabled={isGenerating || barChartData.length === 0} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50">
                            {isGenerating ? 'Generating...' : 'Generate AI Summary'}
                        </button>
                     </div>
                     {reportSummaries.volume && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700 animate-fadeIn">
                            <h4 className="font-bold mb-2 text-gray-800 dark:text-white">AI Analysis</h4>
                            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{reportSummaries.volume}</p>
                        </div>
                     )}
                </div>
           </div>
        </div>
    );
};

interface DashboardProps {
  currentUser: User;
  complaints: Complaint[];
  users: User[];
  onAddComplaint: (location: string, description: string, imageUrl?: string, isPublic?: boolean, authenticityStatus?: 'Unverified' | 'Likely Authentic' | 'Potential Spam') => void;
  onUpdateComplaintStatus: (complaintId: number, status: Status) => void;
  onDeleteComplaint?: (complaintId: number) => void;
  onRestoreComplaint?: (complaintId: number) => void;
  onPermanentDelete?: (complaintId: number) => void;
  onVote?: (complaintId: number) => void;
  userView?: UserView;
  setUserView?: (view: UserView) => void;
  adminView?: AdminView;
  onVerify?: (complaintId: number) => void;
  onAdminVerify?: (complaintId: number, status: 'Verified' | 'Spam') => void;
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, complaints, users, onAddComplaint, onUpdateComplaintStatus, onDeleteComplaint, onRestoreComplaint, onPermanentDelete, onVote, userView, setUserView, adminView, onVerify, onAdminVerify, language }) => {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const handleComplaintSubmit = (location: string, description: string, imageUrl?: string, isPublic?: boolean, authenticityStatus?: 'Unverified' | 'Likely Authentic' | 'Potential Spam') => {
    onAddComplaint(location, description, imageUrl, isPublic, authenticityStatus);
    setUserView?.('history');
  };
  
  const handleComplaintCancel = () => {
    setUserView?.('history');
  };
  
  const handleDeleteWrapper = (id: number) => {
    if (onDeleteComplaint) {
        onDeleteComplaint(id);
        if (selectedComplaint && selectedComplaint.id === id) setSelectedComplaint(null);
    }
  };

  const handleRestoreWrapper = (id: number) => {
    if (onRestoreComplaint) {
        onRestoreComplaint(id);
        if (selectedComplaint && selectedComplaint.id === id) setSelectedComplaint(null);
    }
  };

  const handlePermanentDeleteWrapper = (id: number) => {
    if (onPermanentDelete) {
        onPermanentDelete(id);
        if (selectedComplaint && selectedComplaint.id === id) setSelectedComplaint(null);
    }
  };

  const renderUserDashboard = () => {
    const userComplaints = complaints.filter(c => c.userId === currentUser.id && !c.deletedAt);
    const publicComplaintsBase = complaints.filter(c => c.isPublic && c.status !== Status.RESOLVED && !c.deletedAt);

    switch(userView) {
      case 'home':
        const publicComplaintsHome = [...publicComplaintsBase].sort((a, b) => b.votes - a.votes).slice(0, 5);
        const myComplaintsHome = [...userComplaints].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
        return (
            <div className="space-y-8 animate-fadeIn">
                <section>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTranslation(language, 'trending')}</h2>
                        <button onClick={() => setUserView?.('community')} className="text-green-600 hover:text-green-700 dark:text-green-400 font-semibold text-sm">{getTranslation(language, 'viewAll')}</button>
                    </div>
                    {publicComplaintsHome.length > 0 ? (
                        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                            {publicComplaintsHome.map(c => <CompactComplaintCard key={c.id} complaint={c} onClick={() => setSelectedComplaint(c)} language={language} />)}
                        </div>
                    ) : <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center text-gray-500 shadow-md">No active public complaints.</div>}
                </section>
                <section>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTranslation(language, 'myReports')}</h2>
                        <button onClick={() => setUserView?.('history')} className="text-green-600 hover:text-green-700 dark:text-green-400 font-semibold text-sm">{getTranslation(language, 'viewAll')}</button>
                    </div>
                    {myComplaintsHome.length > 0 ? (
                         <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                            {myComplaintsHome.map(c => <CompactComplaintCard key={c.id} complaint={c} onClick={() => setSelectedComplaint(c)} language={language} />)}
                        </div>
                    ) : <div className="p-8 bg-white dark:bg-gray-800 rounded-lg text-center text-gray-500 shadow-md">
                            {getTranslation(language, 'noComplaints')}<br />
                            <button onClick={() => setUserView?.('fileComplaint')} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">{getTranslation(language, 'fileFirst')}</button>
                        </div>}
                </section>
            </div>
        );
      case 'community':
        const publicComplaints = [...publicComplaintsBase].sort((a, b) => b.votes - a.votes);
        return (
            <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{getTranslation(language, 'community')}</h2>
                {publicComplaints.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {publicComplaints.map(complaint => <CompactComplaintCard key={complaint.id} complaint={complaint} onClick={() => setSelectedComplaint(complaint)} language={language} />)}
                    </div>
                ) : <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500">No active public complaints.</div>}
            </div>
        );
      case 'history':
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{getTranslation(language, 'history')}</h2>
            {userComplaints.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userComplaints.map(complaint => <CompactComplaintCard key={complaint.id} complaint={complaint} onClick={() => setSelectedComplaint(complaint)} language={language} />)}
                </div>
            ) : <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500">{getTranslation(language, 'noComplaints')}</div>}
          </div>
        );
      case 'gamification':
        const sortedUsers = [...users].map(u => {
             const userActivePublicComplaints = complaints.filter(c => c.userId === u.id && c.isPublic && c.status !== Status.RESOLVED && !c.deletedAt && c.authenticityStatus !== 'Spam');
             const totalPoints = u.points + userActivePublicComplaints.reduce((sum, c) => sum + (c.votes * 5), 0);
             const dynamicBadges = [...u.badges];
             const totalVotes = userActivePublicComplaints.reduce((sum, c) => sum + c.votes, 0);
             if (totalVotes >= 5 && !dynamicBadges.includes(Badge.COMMUNITY_VOICE)) dynamicBadges.push(Badge.COMMUNITY_VOICE);
             if (totalVotes >= 10 && !dynamicBadges.includes(Badge.INFLUENCER)) dynamicBadges.push(Badge.INFLUENCER);
             return { ...u, points: totalPoints, badges: dynamicBadges };
        }).filter(u => u.role === Role.USER).sort((a, b) => b.points - a.points);
        const currentUserStats = sortedUsers.find(u => u.id === currentUser.id) || currentUser;
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{getTranslation(language, 'badges')} & {getTranslation(language, 'leaderboard')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{getTranslation(language, 'points')}</h2>
                    <p className="text-4xl font-bold text-green-500">{currentUserStats.points}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{getTranslation(language, 'badges')}</h2>
                    <div className="flex flex-wrap gap-2">
                        {currentUserStats.badges.length > 0 ? currentUserStats.badges.map(badge => <span key={badge} className="px-3 py-1 bg-yellow-200 text-yellow-800 dark:bg-gray-700 dark:text-yellow-300 rounded-full text-sm font-semibold">{badge}</span>) : <p className="text-gray-500">No badges yet.</p>}
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{getTranslation(language, 'leaderboard')}</h3>
                <ol className="space-y-3">
                  {sortedUsers.slice(0, 5).map((user, index) => (
                    <li key={user.id} className={`flex justify-between items-center p-3 rounded-lg ${user.id === currentUser.id ? 'bg-green-100 dark:bg-green-900 ring-2 ring-green-500' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex items-center">
                        <span className="font-bold mr-3 text-lg text-gray-500 w-6 text-center">{index + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.badges.length} Badges</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-500 text-lg">{user.points} pts</span>
                    </li>
                  ))}
                </ol>
            </div>
          </div>
        );
      case 'fileComplaint':
        return <ComplaintForm onSubmit={handleComplaintSubmit} onCancel={handleComplaintCancel} language={language} />;
      case 'help':
          return (
              <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{getTranslation(language, 'help')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">Contact Us</h3>
                          <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
                              <p>Email: support@zerokachra.com</p>
                              <p>Phone: +1 (555) 123-4567</p>
                              <p>Location: 123 Green Way, Eco City</p>
                          </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">FAQ</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Visit our website for full FAQs and documentation.</p>
                      </div>
                  </div>
              </div>
          );
      default: return null;
    }
  }

  const renderAdminDashboard = () => {
    const [historyFilters, setHistoryFilters] = useState({ startDate: '', endDate: '', location: '', status: 'all', authenticity: 'all' });
    const binComplaints = useMemo(() => complaints.filter(c => c.deletedAt).sort((a,b) => (b.deletedAt?.getTime() || 0) - (a.deletedAt?.getTime() || 0)), [complaints]);
    const filteredHistory = useMemo(() => complaints.filter(c => {
            if (c.deletedAt) return false;
            if (historyFilters.status !== 'all' && c.status !== historyFilters.status) return false;
            if (historyFilters.authenticity !== 'all' && c.authenticityStatus !== historyFilters.authenticity) return false;
            if (historyFilters.location && !c.location.toLowerCase().includes(historyFilters.location.toLowerCase())) return false;
            if (historyFilters.startDate && new Date(c.createdAt) < new Date(historyFilters.startDate)) return false;
            if (historyFilters.endDate && new Date(c.createdAt) > new Date(historyFilters.endDate)) return false;
            return true;
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [complaints, historyFilters]);

     switch(adminView) {
        case 'recent':
            const recentComplaints = complaints.filter(c => !c.deletedAt && (c.status === Status.PENDING || c.status === Status.IN_PROGRESS)).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
             return (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Recent Complaints</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {recentComplaints.map(c => <ComplaintCard key={c.id} complaint={c} currentUser={currentUser} onUpdateStatus={onUpdateComplaintStatus} onDelete={handleDeleteWrapper} users={users} isModal={false} onVerify={onVerify} onAdminVerify={onAdminVerify} onClick={() => setSelectedComplaint(c)} language={language} />)}
                  </div>
                  {recentComplaints.length === 0 && <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500">No recent complaints.</div>}
                </div>
            );
        case 'history':
            return (
                <div className="animate-fadeIn">
                     <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Complaint History</h2>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 border border-gray-100 dark:border-gray-700">
                        <input type="text" placeholder="Search location..." value={historyFilters.location} onChange={(e) => setHistoryFilters({...historyFilters, location: e.target.value})} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                         <select value={historyFilters.status} onChange={(e) => setHistoryFilters({...historyFilters, status: e.target.value})} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="all">All Statuses</option>
                            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHistory.map(c => <ComplaintCard key={c.id} complaint={c} currentUser={currentUser} onUpdateStatus={onUpdateComplaintStatus} onDelete={handleDeleteWrapper} users={users} isModal={false} onVerify={onVerify} onAdminVerify={onAdminVerify} onClick={() => setSelectedComplaint(c)} language={language} />)}
                     </div>
                </div>
            );
        case 'reports':
            return <AdminReportsView complaints={complaints} language={language} />;
        case 'bin':
             return (
                <div className="animate-fadeIn">
                     <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{getTranslation(language, 'recycleBin')}</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {binComplaints.map(c => <ComplaintCard key={c.id} complaint={c} currentUser={currentUser} onUpdateStatus={onUpdateComplaintStatus} onRestore={handleRestoreWrapper} onPermanentDelete={handlePermanentDeleteWrapper} users={users} isModal={false} language={language} />)}
                     </div>
                     {binComplaints.length === 0 && <p className="text-gray-500 dark:text-gray-400 mt-4">{getTranslation(language, 'binEmpty')}</p>}
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="container mx-auto">
        {currentUser.role === Role.ADMIN ? renderAdminDashboard() : renderUserDashboard()}
        <ComplaintModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)}>
            {selectedComplaint && (
                <ComplaintCard 
                    complaint={selectedComplaint} 
                    currentUser={currentUser} 
                    onUpdateStatus={onUpdateComplaintStatus} 
                    onDelete={handleDeleteWrapper}
                    onRestore={handleRestoreWrapper}
                    onPermanentDelete={handlePermanentDeleteWrapper}
                    users={users} 
                    onVote={onVote} 
                    isModal={true}
                    onVerify={onVerify}
                    onAdminVerify={onAdminVerify}
                    language={language}
                />
            )}
        </ComplaintModal>
    </div>
  );
};

export default Dashboard;
