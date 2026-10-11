import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthProvider';
import { useCurrentOrg } from '@/lib/useCurrentOrg';

export default function Profile() {
  const { loading: authLoading, user, org, signOut } = useAuth();
  const currentOrg = useCurrentOrg();

  if (authLoading || currentOrg.loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5C5040] font-mono text-base">Loading Profile...</p>
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
              Profile
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Account settings and profile
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Profile Settings</h2>
            <p className="text-base text-[#5C5040] font-semibold mt-0.5">
              Manage your account settings
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Email</label>
                <input type="email" value={user?.email || ''} readOnly className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418]" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Organization</label>
                <input type="text" value={org?.name || ''} readOnly className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418]" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Role</label>
                <input type="text" value={org?.role || ''} readOnly className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418]" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Status</label>
                <input type="text" value={org?.status || ''} readOnly className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418]" />
              </div>
            </div>
            <button onClick={signOut} className="px-4 py-2 bg-[#C44133] hover:bg-[#A0352A] text-white text-xs font-bold rounded-lg transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}