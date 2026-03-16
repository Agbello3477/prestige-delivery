import { useEffect, useState } from 'react';
import { getRiders, verifyRider, assignBikeToRider, notifyRiderNoBike, declineRider, getRiderAnalytics, suspendRider, blockRider, liftSuspension } from '../services/rider.service';
import { BASE_URL } from '../services/api';
import type { Rider } from '../services/rider.service';
import { CheckCircle, Search, X, Star, Ban, Clock, Play, Printer, ExternalLink, Copy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo prestage.jpeg';

const RidersPage = () => {
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

    // Bike assignment state
    const [plateNumber, setPlateNumber] = useState('');
    const [model, setModel] = useState('');
    const [assigningBike, setAssigningBike] = useState(false);

    // Decline state
    const [rejectionReason, setRejectionReason] = useState('');
    const [showDeclineInput, setShowDeclineInput] = useState(false);

    // Suspension state
    const [showSuspendInput, setShowSuspendInput] = useState(false);
    const [suspendDuration, setSuspendDuration] = useState('1');
    const [suspendUnit, setSuspendUnit] = useState<'days' | 'weeks' | 'months'>('weeks');

    // Analytics state
    interface AnalyticsData {
        deliveries: { daily: number; weekly: number; monthly: number; total: number; };
        revenue: { total: number; byMethod: { COD: number; TRANSFER: number; POS: number; }; riderCommission: number; codRemittance: number; };
    }
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        loadRiders();
    }, []);

    // Check for Deep Link '?id=RID'
    useEffect(() => {
        if (riders.length > 0) {
            const queryParams = new URLSearchParams(location.search);
            const riderIdParam = queryParams.get('id');
            if (riderIdParam) {
                const id = parseInt(riderIdParam);
                const targetRider = riders.find(r => r.id === id);
                if (targetRider && !selectedRider) {
                    handleViewDetails(targetRider);
                    // Clear the query param so it doesn't trigger again on close
                    navigate('/dashboard/riders', { replace: true });
                }
            }
        }
    }, [riders, location.search, navigate]);

    const loadRiders = async () => {
        try {
            const data = await getRiders();
            setRiders(data);
        } catch (error) {
            console.error('Failed to load riders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (rider: Rider) => {
        setSelectedRider(rider);
        setShowDeclineInput(false);
        setShowSuspendInput(false);
        setRejectionReason('');

        setLoadingAnalytics(true);
        getRiderAnalytics(rider.id)
            .then(setAnalytics)
            .catch(() => setAnalytics(null))
            .finally(() => setLoadingAnalytics(false));
    };

    const handleVerify = async (id: number) => {
        await verifyRider(id);
        // Optimistically update UI
        setRiders(riders.map(r => r.id === id ? { ...r, isVerified: true, isRejected: false } : r));
    };

    const handleDecline = async (id: number) => {
        if (!rejectionReason.trim()) {
            alert("Please provide a reason for declining.");
            return;
        }
        try {
            await declineRider(id, rejectionReason);
            setRiders(riders.map(r => r.id === id ? { ...r, isRejected: true, rejectionReason } : r));
            setSelectedRider(null);
            setShowDeclineInput(false);
            setRejectionReason('');
            alert("Rider declined successfully.");
        } catch {
            alert("Failed to decline rider.");
        }
    };

    const handleSuspend = async (id: number) => {
        try {
            const data = await suspendRider(id, parseInt(suspendDuration), suspendUnit);
            setRiders(riders.map(r => r.id === id ? { ...r, isSuspended: true, suspensionEndDate: data.suspensionEndDate } : r));
            setSelectedRider({ ...selectedRider!, isSuspended: true, suspensionEndDate: data.suspensionEndDate });
            setShowSuspendInput(false);
            alert("Rider suspended successfully.");
        } catch {
            alert("Failed to suspend rider.");
        }
    };

    const handleBlock = async (id: number) => {
        if (!window.confirm("Are you sure you want to permanently block this rider?")) return;
        try {
            await blockRider(id);
            setRiders(riders.map(r => r.id === id ? { ...r, isBlocked: true } : r));
            setSelectedRider({ ...selectedRider!, isBlocked: true });
            alert("Rider blocked successfully.");
        } catch {
            alert("Failed to block rider.");
        }
    };

    const handleLiftSuspension = async (id: number) => {
        try {
            await liftSuspension(id);
            setRiders(riders.map(r => r.id === id ? { ...r, isSuspended: false, isBlocked: false, suspensionEndDate: undefined } : r));
            setSelectedRider({ ...selectedRider!, isSuspended: false, isBlocked: false, suspensionEndDate: undefined });
            alert("Suspension/Block lifted successfully.");
        } catch {
            alert("Failed to lift suspension.");
        }
    };

    const handleAssignBike = async (id: number) => {
        if (!plateNumber || !model) {
            alert("Please enter plate number and model.");
            return;
        }
        setAssigningBike(true);
        try {
            await assignBikeToRider(id, plateNumber, model);
            alert("Bike assigned successfully and rider notified!");
            setSelectedRider(null);
            loadRiders(); // Reload to get updated vehicle info
        } catch {
            alert("Failed to assign bike.");
        } finally {
            setAssigningBike(false);
            setPlateNumber('');
            setModel('');
        }
    };

    const getImageUrl = (url: string | undefined | null) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // Backward compatibility for local uploads
        return `${BASE_URL}/${url.replace(/\\/g, '/')}`;
    };

    const handlePrintSlip = () => {
        if (!selectedRider) return;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the verification slip');
            return;
        }

        // Ensure we have absolute URLs for all assets
        const origin = window.location.origin;
        const absoluteLogoUrl = logo.startsWith('http') ? logo : `${origin}${logo.startsWith('/') ? '' : '/'}${logo}`;
        const passportUrl = getImageUrl(selectedRider.passportUrl);
        const ninUrl = getImageUrl(selectedRider.ninSlipUrl);

        printWindow.document.write(`
            <html>
                <head>
                    <title>Rider Verification Slip - ${selectedRider.name}</title>
                    <style>
                        @page { size: portrait; margin: 0; }
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; position: relative; -webkit-print-color-adjust: exact; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e11d48; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { height: 70px; object-fit: contain; }
                        .title { font-size: 28px; font-weight: 800; color: #e11d48; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                        .info-section { display: grid; grid-template-columns: 1fr; gap: 15px; background: #fff5f5; padding: 25px; border-radius: 12px; border: 1px solid #fecaca; margin-bottom: 35px; }
                        .info-row { display: flex; border-bottom: 1px solid #fee2e2; padding-bottom: 8px; }
                        .info-row:last-child { border-bottom: none; }
                        .info-label { font-weight: 700; width: 160px; color: #991b1b; font-size: 14px; }
                        .info-value { font-weight: 500; color: #111827; flex: 1; }
                        .image-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; }
                        .image-container { text-align: center; background: #fff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                        .doc-image { width: 100%; height: 280px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; border: 1px solid #f3f4f6; }
                        .image-label { font-weight: 700; color: #4b5563; font-size: 14px; margin-bottom: 10px; display: block; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
                        .watermark-img { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; width: 600px; pointer-events: none; z-index: -10; }
                        .footer { margin-top: 50px; padding-top: 25px; border-top: 2px solid #f3f4f6; text-align: center; }
                        .powered-by { color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 10px; }
                        @media print {
                            .no-print { display: none; }
                            body { margin: 0; padding: 40px; }
                            .image-container { break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="watermark-img"><img src="${absoluteLogoUrl}" style="width: 100%;" crossorigin="anonymous" /></div>
                    <div class="header">
                        <div>
                            <h1 class="title">Rider Identity Card</h1>
                            <p style="margin: 5px 0 0 0; color: #6b7280; font-weight: 600;">Prestige Delivery & Logistics Services</p>
                        </div>
                        <img src="${absoluteLogoUrl}" class="logo" crossorigin="anonymous" />
                    </div>

                    <div class="info-section">
                        <div class="info-row"><span class="info-label">REGISTRATION NAME:</span> <span class="info-value">${selectedRider.name}</span></div>
                        <div class="info-row"><span class="info-label">E-MAIL ADDRESS:</span> <span class="info-value">${selectedRider.email}</span></div>
                        <div class="info-row"><span class="info-label">PHONE NUMBER:</span> <span class="info-value">${selectedRider.phone}</span></div>
                        <div class="info-row"><span class="info-label">NIN NUMBER:</span> <span class="info-value">${selectedRider.nin || 'N/A'}</span></div>
                        <div class="info-row"><span class="info-label">HOME ADDRESS:</span> <span class="info-value">${selectedRider.address || 'N/A'}</span></div>
                        <div class="info-row"><span class="info-label">STATE OF ORIGIN:</span> <span class="info-value">${selectedRider.stateOfOrigin || 'N/A'}</span></div>
                        <div class="info-row"><span class="info-label">VERIFIED STATUS:</span> <span class="info-value" style="color: ${selectedRider.isVerified ? '#059669' : '#d97706'}; font-weight: 800;">${selectedRider.isVerified ? 'APPROVED' : 'PENDING VERIFICATION'}</span></div>
                    </div>

                    <div class="image-section">
                        <div class="image-container">
                            <span class="image-label">PASSPORT PHOTOGRAPH</span>
                            ${passportUrl ? `<img src="${passportUrl}" class="doc-image" crossorigin="anonymous" />` : '<div style="height: 280px; background: #f9fafb; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #9ca3af;">NO PHOTO UPLOADED</div>'}
                        </div>
                        <div class="image-container">
                            <span class="image-label">NIN SLIP / ID CARD</span>
                            ${ninUrl ? `<img src="${ninUrl}" class="doc-image" crossorigin="anonymous" />` : '<div style="height: 280px; background: #f9fafb; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #9ca3af;">NO DOCUMENT UPLOADED</div>'}
                        </div>
                    </div>

                    <div class="footer">
                        <p style="font-size: 13px; color: #374151; max-width: 500px; margin: 0 auto; line-height: 1.5;">This document serves as physical proof of the rider's registration and verification status with Prestige Delivery & Logistics Services. For inquiries, contact: support@prestige-delivery.com</p>
                        <div class="powered-by">Powered by: MaSha Secure Tech</div>
                    </div>
                    
                    <script>
                        // Wait for images to load before printing
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                // Optional: autoclose after printing
                                // window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleNotifyNoBike = async (id: number) => {
        try {
            await notifyRiderNoBike(id);
            alert("Rider notified about unavailable bikes.");
            setSelectedRider(null);
        } catch {
            alert("Failed to notify rider.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Rider Management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search riders..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {riders.map((rider) => (
                            <tr key={rider.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{rider.name}</div>
                                    <div className="text-sm text-gray-500">{rider.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {rider.phone}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {rider.vehicles && rider.vehicles.length > 0 ? `${rider.vehicles[0].type} - ${rider.vehicles[0].plateNumber}` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {rider.isBlocked ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-800 text-white">Blocked</span>
                                    ) : rider.isSuspended ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Suspended</span>
                                    ) : rider.isRejected ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Declined</span>
                                    ) : rider.isVerified ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Verified</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-3">
                                        <button
                                            onClick={() => handleViewDetails(rider)}
                                            className="text-brand-600 hover:text-brand-900 font-semibold"
                                        >
                                            View Details
                                        </button>
                                        {!rider.isVerified && !rider.isRejected && (
                                            <button
                                                onClick={() => handleVerify(rider.id)}
                                                className="text-green-600 hover:text-green-900 flex items-center"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-1" /> Approve
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Rider Details Modal */}
            {selectedRider && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div className="flex items-center space-x-3">
                                <h3 className="text-xl font-bold text-gray-900">Rider Verification Details</h3>
                                <button
                                    onClick={handlePrintSlip}
                                    className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center text-sm font-medium"
                                    title="Print Verification Slip"
                                >
                                    <Printer className="w-5 h-5 mr-1" /> Print Slip
                                </button>
                            </div>
                            <button onClick={() => setSelectedRider(null)} title="Close Modal" className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="font-semibold text-gray-900">{selectedRider.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Contact</p>
                                    <p className="font-semibold text-gray-900">{selectedRider.phone}</p>
                                    <p className="text-sm text-gray-700">{selectedRider.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">NIN Number</p>
                                    <p className="font-semibold text-gray-900">{selectedRider.nin || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">State of Origin</p>
                                    <p className="font-semibold text-gray-900">{selectedRider.stateOfOrigin || 'Not provided'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Residential Address</p>
                                    <p className="font-semibold text-gray-900">{selectedRider.address || 'Not provided'}</p>
                                </div>
                            </div>

                            {/* Performance & Analytics */}
                            <div className="mt-2 pt-4 border-t">
                                <h4 className="font-semibold text-gray-900 mb-4">Performance & Statistics</h4>

                                {/* Rating */}
                                <div className="flex items-center space-x-2 mb-4 bg-brand-50 p-3 rounded-lg w-fit border border-brand-100">
                                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                    <span className="font-bold text-gray-900 text-lg">
                                        {selectedRider.rating ? selectedRider.rating.toFixed(1) : 'New'}
                                    </span>
                                    <span className="text-gray-500 text-sm font-medium">
                                        ({selectedRider.ratingCount || 0} reviews)
                                    </span>
                                </div>

                                {loadingAnalytics ? (
                                    <div className="text-center py-4 text-gray-500">Loading extended analytics...</div>
                                ) : analytics ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <p className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-200 pb-2">Delivery Volume</p>
                                            <div className="flex justify-between mb-1"><span className="text-gray-500">Today:</span> <span className="font-bold">{analytics.deliveries.daily}</span></div>
                                            <div className="flex justify-between mb-1"><span className="text-gray-500">This Week:</span> <span className="font-bold">{analytics.deliveries.weekly}</span></div>
                                            <div className="flex justify-between mb-1"><span className="text-gray-500">This Month:</span> <span className="font-bold">{analytics.deliveries.monthly}</span></div>
                                            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200"><span className="text-gray-800 font-bold">Total All-Time:</span> <span className="font-black text-brand-600">{analytics.deliveries.total}</span></div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
                                            <p className="text-sm font-bold text-gray-700 mb-2 border-b border-green-200 pb-2">Financials (All-Time)</p>
                                            <div className="flex justify-between mb-1"><span className="text-gray-600 font-medium">COD:</span> <span className="font-bold text-gray-800">₦{analytics.revenue.byMethod.COD}</span></div>
                                            <div className="flex justify-between mb-1"><span className="text-gray-600 font-medium">Transfer:</span> <span className="font-bold text-gray-800">₦{analytics.revenue.byMethod.TRANSFER}</span></div>
                                            <div className="flex justify-between mb-1"><span className="text-gray-600 font-medium">POS:</span> <span className="font-bold text-gray-800">₦{analytics.revenue.byMethod.POS}</span></div>
                                            <div className="flex justify-between mt-2 pt-2 border-t border-green-200"><span className="text-brand-800 font-bold">Rider Commission (70%):</span> <span className="font-bold text-brand-700">₦{analytics.revenue.riderCommission.toFixed(2)}</span></div>
                                            <div className="flex justify-between mt-2 pt-2 border-t border-red-200 bg-red-50 p-2 rounded -mx-2 mb-[-8px]">
                                                <span className="text-red-900 font-bold">Pending Remittance:</span>
                                                <span className={`font-black ${analytics.revenue.codRemittance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {analytics.revenue.codRemittance > 0 ? `₦${analytics.revenue.codRemittance.toFixed(2)} (Owes)` : `₦${Math.abs(analytics.revenue.codRemittance).toFixed(2)} (Owed)`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic">No delivery statistics available.</div>
                                )}
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Passport Photograph</p>
                                    {selectedRider.passportUrl ? (
                                        <div
                                            className="w-full h-48 cursor-pointer relative group rounded-lg overflow-hidden border bg-gray-50"
                                            onClick={() => setEnlargedImage(`${BASE_URL}/${selectedRider.passportUrl!.replace(/\\/g, '/')}?t=${Date.now()}`)}
                                        >
                                            <img 
                                                src={`${getImageUrl(selectedRider.passportUrl)}${selectedRider.passportUrl?.startsWith('http') ? '' : `?t=${Date.now()}`}`} 
                                                alt="Passport" 
                                                className="w-full h-full object-cover" 
                                                crossOrigin="anonymous"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Passport+Not+Found';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <Search className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                    {selectedRider.passportUrl && (
                                        <div className="flex mt-2 space-x-2">
                                            <a 
                                                href={getImageUrl(selectedRider.passportUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs flex items-center justify-center"
                                            >
                                                <ExternalLink className="w-3 h-3 mr-1" /> Open
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    const url = getImageUrl(selectedRider.passportUrl);
                                                    navigator.clipboard.writeText(url);
                                                    alert('URL Copied!');
                                                }}
                                                className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs flex items-center justify-center"
                                            >
                                                <Copy className="w-3 h-3 mr-1" /> Copy URL
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">NIN Slip</p>
                                    {selectedRider.ninSlipUrl ? (
                                        <div
                                            className="w-full h-48 cursor-pointer relative group rounded-lg overflow-hidden border bg-gray-50"
                                            onClick={() => setEnlargedImage(`${BASE_URL}/${selectedRider.ninSlipUrl!.replace(/\\/g, '/')}?t=${Date.now()}`)}
                                        >
                                            <img 
                                                src={`${getImageUrl(selectedRider.ninSlipUrl)}${selectedRider.ninSlipUrl?.startsWith('http') ? '' : `?t=${Date.now()}`}`} 
                                                alt="NIN Slip" 
                                                className="w-full h-full object-cover" 
                                                crossOrigin="anonymous"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=NIN+Slip+Not+Found';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <Search className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">No Document</div>
                                    )}
                                    {selectedRider.ninSlipUrl && (
                                        <div className="flex mt-2 space-x-2">
                                            <a 
                                                href={getImageUrl(selectedRider.ninSlipUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs flex items-center justify-center"
                                            >
                                                <ExternalLink className="w-3 h-3 mr-1" /> Open
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    const url = getImageUrl(selectedRider.ninSlipUrl);
                                                    navigator.clipboard.writeText(url);
                                                    alert('URL Copied!');
                                                }}
                                                className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs flex items-center justify-center"
                                            >
                                                <Copy className="w-3 h-3 mr-1" /> Copy URL
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Disciplinary Actions */}
                            {selectedRider.isVerified && !selectedRider.isRejected && (
                                <div className="mt-6 pt-4 border-t">
                                    <h4 className="font-semibold text-gray-900 flex justify-between items-center mb-4">
                                        Disciplinary Controls
                                        {(selectedRider.isBlocked || selectedRider.isSuspended) && (
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                {selectedRider.isBlocked ? 'Currently Blocked' : `Suspended until ${new Date(selectedRider.suspensionEndDate!).toLocaleDateString()}`}
                                            </span>
                                        )}
                                    </h4>

                                    {selectedRider.isBlocked || selectedRider.isSuspended ? (
                                        <button
                                            onClick={() => handleLiftSuspension(selectedRider.id)}
                                            className="w-full flex justify-center items-center py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-bold"
                                        >
                                            <Play className="w-5 h-5 mr-2" /> Lift Disciplinary Action & Restore Account
                                        </button>
                                    ) : (
                                        <div className="flex flex-col space-y-3">
                                            {showSuspendInput ? (
                                                <div className="bg-orange-50 p-4 border border-orange-200 rounded-lg space-y-3">
                                                    <h5 className="font-bold text-orange-900">Suspend Rider</h5>
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="number"
                                                            title="Suspension Duration"
                                                            min="1"
                                                            value={suspendDuration}
                                                            onChange={e => setSuspendDuration(e.target.value)}
                                                            className="flex-1 p-2 border rounded"
                                                        />
                                                        <select
                                                            title="Suspension Unit"
                                                            value={suspendUnit}
                                                            onChange={e => setSuspendUnit(e.target.value as 'days' | 'weeks' | 'months')}
                                                            className="flex-1 p-2 border rounded"
                                                        >
                                                            <option value="days">Days</option>
                                                            <option value="weeks">Weeks</option>
                                                            <option value="months">Months</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex justify-end space-x-2">
                                                        <button onClick={() => setShowSuspendInput(false)} className="px-3 py-1.5 text-gray-600 hover:bg-orange-100 rounded">Cancel</button>
                                                        <button onClick={() => handleSuspend(selectedRider.id)} className="px-3 py-1.5 bg-orange-600 text-white rounded font-bold hover:bg-orange-700">Confirm Suspension</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => setShowSuspendInput(true)}
                                                        className="flex-1 flex justify-center items-center py-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 font-medium"
                                                    >
                                                        <Clock className="w-5 h-5 mr-2" /> Temporary Suspension
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlock(selectedRider.id)}
                                                        className="flex-1 flex justify-center items-center py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium"
                                                    >
                                                        <Ban className="w-5 h-5 mr-2" /> Permanent Block
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Verification Actions */}
                            {selectedRider.isRejected ? (
                                <div className="mt-6 pt-4 border-t">
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                        <h4 className="text-red-800 font-bold mb-1">Rider Application Declined</h4>
                                        <p className="text-red-600 text-sm">Reason: {selectedRider.rejectionReason}</p>
                                    </div>
                                </div>
                            ) : !selectedRider.isVerified ? (
                                <div className="mt-6 pt-4 border-t flex flex-col space-y-4">
                                    {showDeclineInput ? (
                                        <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
                                            <h4 className="font-semibold text-red-900">Provide Decline Reason</h4>
                                            <textarea
                                                className="w-full p-3 border border-red-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                                                rows={3}
                                                placeholder="Explain why this rider is being declined..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setShowDeclineInput(false);
                                                        setRejectionReason('');
                                                    }}
                                                    className="px-4 py-2 text-gray-600 hover:bg-red-100 rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleDecline(selectedRider.id)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    Submit Decline
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => setShowDeclineInput(true)}
                                                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                Decline Rider
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleVerify(selectedRider.id);
                                                    setSelectedRider(null);
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" /> Approve Rider
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                selectedRider.vehicles && selectedRider.vehicles.length === 0 && (
                                    <div className="mt-6 pt-4 border-t space-y-4">
                                        <h4 className="font-semibold text-gray-900">Assign Bike to Rider</h4>
                                        <p className="text-sm text-gray-500">This rider requested a bike during registration.</p>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder="Vehicle Model (e.g. Honda CG125)"
                                                value={model}
                                                onChange={(e) => setModel(e.target.value)}
                                                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Plate Number"
                                                value={plateNumber}
                                                onChange={(e) => setPlateNumber(e.target.value)}
                                                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleNotifyNoBike(selectedRider.id)}
                                                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                            >
                                                Notify: No Bikes Available
                                            </button>
                                            <button
                                                onClick={() => handleAssignBike(selectedRider.id)}
                                                disabled={assigningBike}
                                                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                                            >
                                                {assigningBike ? 'Assigning...' : 'Assign Bike'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Enlarge Image Modal */}
            {enlargedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setEnlargedImage(null)}
                >
                    <button
                        title="Close Expanded Image"
                        onClick={() => setEnlargedImage(null)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={enlargedImage}
                        alt="Enlarged Document"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                    />
                </div>
            )}
        </div>
    );
};

export default RidersPage;
