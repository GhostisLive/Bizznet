import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthProvider';
import { useCurrentOrg } from '@/lib/useCurrentOrg';

export default function CarbonAudit() {
  const { loading: authLoading } = useAuth();
  const currentOrg = useCurrentOrg();

  if (authLoading || currentOrg.loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5C5040] font-mono text-base">Loading Carbon Audit...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans text-base">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
      
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Carbon Audit
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Carbon audit overview
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Carbon Audit</h2>
            <p className="text-base text-[#5C5040] font-semibold mt-0.5">
              View carbon audit details
            </p>
          </div>
          <div className="p-6">
            <p className="text-[#5C5040]">Carbon audit interface will appear here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}