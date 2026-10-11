import { Routes, Route } from 'react-router-dom';
import { Providers } from './app/providers';
import Layout from './app/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Products from './pages/Products';
import RFQ from './pages/RFQ';
import Negotiations from './pages/Negotiations';
import Messages from './pages/Messages';
import Transactions from './pages/Transactions';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import RequestAudit from './pages/RequestAudit';
import CompanyAudit from './pages/CompanyAudit';
import LabourAudit from './pages/LabourAudit';
import CarbonAudit from './pages/CarbonAudit';
import AuditorDashboard from './pages/AuditorDashboard';
import WWorkspace from './pages/WWorkspace';
import AuditorAuditLogs from './pages/Auditor/AuditLogs';
import AuditorCertifications from './pages/Auditor/Certifications';
import AuditorCreateAuditRequest from './pages/Auditor/CreateAuditRequest';
import AuditorPerformAudit from './pages/Auditor/PerformAudit';

function App() {
  return (
    <Providers>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="products" element={<Products />} />
          <Route path="rfq" element={<RFQ />} />
          <Route path="negotiations" element={<Negotiations />} />
          <Route path="messages" element={<Messages />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="request-audit" element={<RequestAudit />} />
          <Route path="company-audit" element={<CompanyAudit />} />
          <Route path="labour-audit" element={<LabourAudit />} />
          <Route path="carbon-audit" element={<CarbonAudit />} />
          <Route path="auditor-dashboard" element={<AuditorDashboard />} />
          <Route path="wworkspace" element={<WWorkspace />} />
          <Route path="auditor/audit-logs" element={<AuditorAuditLogs />} />
          <Route path="auditor/certifications" element={<AuditorCertifications />} />
          <Route path="auditor/create-audit-request" element={<AuditorCreateAuditRequest />} />
          <Route path="auditor/perform-audit" element={<AuditorPerformAudit />} />
        </Route>
      </Routes>
    </Providers>
  );
}

export default App;