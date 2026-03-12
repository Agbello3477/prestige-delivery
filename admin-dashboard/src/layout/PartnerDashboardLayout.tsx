import type { ReactNode } from 'react';
import PartnerSidebar from '../components/PartnerSidebar';
import Footer from '../components/Footer';

const PartnerDashboardLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex h-screen bg-gray-50">
            <PartnerSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default PartnerDashboardLayout;
