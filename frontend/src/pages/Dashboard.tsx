import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthProvider';
import { useCurrentOrg } from '@/lib/useCurrentOrg';

export default function Dashboard() {
  const { loading: authLoading } = useAuth();
  const currentOrg = useCurrentOrg();

  if (authLoading || currentOrg.loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5C5040] font-mono text-base">Loading Dashboard...</p>
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
              {currentOrg.orgName} &middot; {currentOrg.roleLabel} Dashboard
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              BizzNet Supply Chain & Carbon Intelligence Platform
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Active Negotiations</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
                0 Deals
              </h2>
            </div>
            <div className="mt-3 text-xs font-mono text-[#6B5B3E] font-bold">
              No negotiations yet
            </div>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Carbon Footprint</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2E7D5B] tracking-tight">
                0.00 MT CO₂e
              </h2>
            </div>
            <div className="mt-3 text-xs font-mono text-[#2E7D5B] font-bold">
              Add facilities to track carbon
            </div>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Pending Verifications</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
                0 Requests
              </h2>
            </div>
            <div className="mt-3 text-xs font-mono text-[#6B5B3E] font-bold">
              All verifications complete
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Welcome to BizzNet</h2>
            <p className="text-base text-[#5C5040] font-semibold mt-0.5">
              Your supply chain provenance and carbon intelligence platform
            </p>
          </div>
          <div className="p-6">
            <p className="text-[#5C5040]">Start by adding products, facilities, or exploring the marketplace.</p>
          </div>
        </div>
      </main>
    </div>
  );
}