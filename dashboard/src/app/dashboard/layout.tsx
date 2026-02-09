import Sidebar from '../../components/Sidebar';
import Aurora from '../../components/Aurora';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black relative">
            {/* Global Background for Dashboard */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Aurora colorStops={["#2e1065", "#4c1d95", "#0f172a"]} blend={0.6} />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            </div>

            <Sidebar />

            {/* Main Content Area */}
            <main className="lg:pl-64 min-h-screen relative z-10 transition-all duration-300">
                <div className="container mx-auto px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
