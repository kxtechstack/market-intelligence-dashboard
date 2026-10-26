import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface WorkspaceConfigPaneProps {
  onReturn: () => void;
  clientId: string;
}

interface ClientData {
  company_name: string;
  industry: string;
  location: string;
  client_description: string;
}

interface ICPData {
  competitors: string[];
  core_sectors: string[];
  designations: string[];
  geographic_focus: string[];
  sectors_to_avoid: string[];
  focus_products_services: string[];
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  is_active: boolean;
  last_active: string;
}

export default function WorkspaceConfigPane({ onReturn, clientId }: WorkspaceConfigPaneProps) {
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    client: ClientData | null;
    icp: ICPData | null;
    users: UserData[];
    enabledModules: { id: string; module_name: string }[];
  }>({
    client: null,
    icp: null,
    users: [],
    enabledModules: []
  });

  useEffect(() => {
    async function fetchData() {
      if (!clientId) return;
      try {
        setLoading(true);
        
        // Fetch client, ICP, and users in parallel using client-side SDK
        const [clientRes, icpRes, usersRes] = await Promise.all([
          supabase
            .schema('admin')
            .from('clients')
            .select('company_name, industry, location, client_description, enabled_modules')
            .eq('id', clientId)
            .single(),
          supabase
            .schema('admin')
            .from('client_icp')
            .select('context_json')
            .eq('client_id', clientId)
            .maybeSingle(),
          supabase
            .schema('admin')
            .from('client_users')
            .select('first_name, last_name, email, designation, is_active, last_active')
            .eq('client_id', clientId)
        ]);

        if (clientRes.error) throw clientRes.error;
        const clientData = clientRes.data;

        // Fetch actual module names if enabled_modules exist
        let enabledModulesData: { id: string; module_name: string }[] = [];
        if (clientData.enabled_modules && Array.isArray(clientData.enabled_modules) && clientData.enabled_modules.length > 0) {
          const { data: modules, error: modulesError } = await supabase
            .schema('admin')
            .from('modules')
            .select('id, module_name')
            .in('id', clientData.enabled_modules);
          
          if (!modulesError && modules) {
            enabledModulesData = modules;
          }
        }

        const context = icpRes.data?.context_json || {};
        const userData = usersRes.data || [];

        setData({
          client: clientData,
          icp: context,
          users: userData,
          enabledModules: enabledModulesData
        });
      } catch (error) {
        console.error("Failed to fetch workspace config:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clientId]);

  const menuItems = [
    { id: "profile", label: "Organization Profile" },
    { id: "subscription", label: "Subscription & Modules" },
    { id: "audit", label: "Access Logs" },
  ];

  const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
    <div className="mb-3">
      <h3 className="text-[17px] font-semibold text-zinc-900 tracking-tight mb-0.5 font-sans">{title}</h3>
      {description && <p className="text-[12.5px] text-zinc-500 font-medium font-sans">{description}</p>}
    </div>
  );

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-zinc-200 rounded-[8px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-fit">
      <div className="px-3.5 py-2 border-b border-zinc-100 bg-[#fbfbfb] flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-zinc-700 uppercase tracking-wider font-sans">{title}</span>
      </div>
      <div className="p-3.5">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value, isFullWidth = false }: { label: string; value: string | React.ReactNode; isFullWidth?: boolean }) => (
    <div className={`flex flex-col gap-0.5 ${isFullWidth ? "col-span-full" : ""}`}>
      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">{label}</span>
      <div className="text-[13px] text-zinc-800 font-medium leading-relaxed font-sans">
        {value || <span className="text-zinc-300 italic">Not specified</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-medium text-zinc-500 font-sans">Loading configuration...</span>
        </div>
      </div>
    );
  }

  const { client, icp, users, enabledModules } = data;

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden animate-fade-in font-sans">
      {/* Header - Consistent with Market Dynamics and Forward Outlook */}
      <div className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <h2 
            style={{ fontFamily: "'Source Serif 4', Georgia, Cambria, 'Times New Roman', Times, serif" }}
            className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none font-serif-source"
          >
            Workspace Configuration
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-[4px]">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider font-sans">System Operational</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Local Sidebar */}
        <div className="w-64 border-r border-zinc-100 bg-[#fbfbfb] flex flex-col p-3 gap-0.5">
          <div className="px-3 mb-2 mt-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">Configuration Sections</span>
          </div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-3 py-2 rounded-[6px] transition-all text-[13px] font-sans ${
                activeSection === item.id 
                  ? "bg-zinc-100 text-zinc-900 font-semibold" 
                  : "text-zinc-600 hover:bg-zinc-100/50 hover:text-zinc-900 font-medium"
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-full p-4 pl-6">
            {activeSection === "profile" && (
              <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Hero Banner - Professional Dark Theme */}
                <div className="bg-zinc-900 rounded-[10px] p-4 text-white relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-24 -mb-24" />
                  
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-[18px] font-bold tracking-tight mb-1">{client?.company_name || "Internal Workspace"}</h1>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium font-sans">
                        <span>{client?.location}</span>
                        {client?.location && client?.industry && <span className="w-1 h-1 bg-zinc-600 rounded-full" />}
                        <span>{client?.industry}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {/* Client Identity */}
                  <InfoCard title="Client Identity">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-12">
                      <InfoRow label="Client Name" value={client?.company_name} />
                      <InfoRow label="Industry / Sector" value={client?.industry} />
                      <InfoRow label="Location" value={client?.location} />
                      <InfoRow label="Client Description" value={client?.client_description} isFullWidth />
                    </div>
                  </InfoCard>

                  {/* Offerings */}
                  <InfoCard title="Offerings & Market Position">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-12">
                      <InfoRow label="Focus Products or Services" value={icp?.focus_products_services?.join(', ')} isFullWidth />
                      <InfoRow label="Competitors" value={icp?.competitors?.join(', ')} isFullWidth />
                    </div>
                  </InfoCard>

                  {/* ICP Definition */}
                  <InfoCard title="ICP Definition">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-12">
                      <InfoRow label="Core Sectors" value={icp?.core_sectors?.join(', ')} />
                      <InfoRow label="Geographic Focus" value={icp?.geographic_focus?.join(', ')} />
                      <InfoRow label="Sectors to Avoid" value={icp?.sectors_to_avoid?.join(', ')} />
                      <InfoRow label="Designations" value={icp?.designations?.join(', ')} />
                    </div>
                  </InfoCard>

                  {/* Manage Info Text */}
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-[8px] text-zinc-500 font-sans">
                    <p className="text-[12px] font-medium leading-relaxed">
                      This information is managed by Inside Market. To request a change, please contact your account representative.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "subscription" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <SectionHeader 
                  title="Subscription & Intelligence Modules" 
                  description="Review your active service tier and intelligence capabilities."
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 border border-zinc-200 rounded-[8px] bg-zinc-50/50">
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans mb-1.5">Account Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <div className="text-[17px] font-bold text-zinc-800 font-sans">Active</div>
                    </div>
                  </div>
                  <div className="p-4 border border-zinc-200 rounded-[8px] bg-zinc-50/50">
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans mb-1.5">Enabled Modules</div>
                    <div className="text-[17px] font-bold text-zinc-800 font-sans">{enabledModules.length} Active Modules</div>
                  </div>
                </div>

                <InfoCard title="Intelligent System Modules">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {enabledModules.length > 0 ? (
                      enabledModules.map((module) => (
                        <div key={module.id} className="flex items-center justify-between p-3 bg-zinc-50/50 border border-zinc-100 rounded-[6px] transition-all group cursor-default">
                          <span className="text-[13px] font-semibold text-zinc-800 font-sans">{module.module_name}</span>
                          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-semibold uppercase tracking-wider rounded border border-emerald-100 font-sans">
                            Active
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-zinc-400 text-[13px] italic font-sans">
                        No active intelligence modules enabled.
                      </div>
                    )}
                  </div>
                </InfoCard>
              </div>
            )}

            {activeSection === "audit" && (
              <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <SectionHeader 
                  title="Team Access Details" 
                  description="Recent administrative and strategic access events for your organization."
                />
                
                <div className="border border-zinc-200 rounded-[8px] overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <table className="w-full text-left border-collapse table-fixed font-sans">
                    <thead>
                      <tr className="bg-[#fbfbfb] border-b border-zinc-100">
                        <th className="w-[30%] px-3.5 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans !text-left">Name</th>
                        <th className="w-[30%] px-3.5 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans !text-left">Designation</th>
                        <th className="w-[30%] px-3.5 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans !text-left">Email</th>
                        <th className="w-[10%] px-3.5 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-sans text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {users.length > 0 ? (
                        users.map((user, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/30 transition-colors">
                            <td className="px-3.5 py-2.5 text-[13px] text-zinc-900 font-bold truncate text-left">{user.first_name} {user.last_name}</td>
                            <td className="px-3.5 py-2.5 text-[12.5px] text-zinc-600 font-medium truncate text-left">{user.designation}</td>
                            <td className="px-3.5 py-2.5 text-[12.5px] text-zinc-500 truncate text-left">{user.email}</td>
                            <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${user.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                                {user.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-400 text-[13px] italic">
                            No team members found for this client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-[8px] text-zinc-500 font-sans">
                    <p className="text-[12px] font-medium leading-relaxed">
                      To add, remove, or update team access, please contact your account representative.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
