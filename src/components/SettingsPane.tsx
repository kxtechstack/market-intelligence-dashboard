import React from "react";
import { Sliders, ArrowLeft } from "lucide-react";

interface SettingsPaneProps {
  onReturn: () => void;
}

export default function SettingsPane({ onReturn }: SettingsPaneProps) {
  return (
    <div className="flex-1 h-full bg-zinc-50 flex items-center justify-center p-8 select-none">
      <div className="max-w-md w-full bg-white border border-zinc-200 p-6 rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-center flex flex-col items-center">
        <Sliders className="w-8 h-8 text-[#7c3aed] mb-4" />
        <h3 className="text-base font-medium text-zinc-900 mb-1">Workspace configurations</h3>
        <p className="text-[12.5px] text-zinc-500 leading-relaxed mb-6">
          Define regulatory alerts triggers, SLA limits threshold controls, and API access bindings.
        </p>
        <div className="w-full flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-100">
            <span className="text-zinc-500 font-normal">Regulatory database source</span>
            <span className="text-zinc-800 font-medium font-mono text-[10.5px]">Graceview-APRA v4.11</span>
          </div>
          <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-100">
            <span className="text-zinc-500 font-normal">Active compliance alerts</span>
            <span className="text-zinc-800 font-medium">12 policy standards</span>
          </div>
          <div className="flex items-center justify-between text-xs py-2">
            <span className="text-zinc-500 font-normal">AI server model</span>
            <span className="text-[#7c3aed] font-medium font-mono text-[10.5px]">gemini-3.5-flash</span>
          </div>
        </div>
        <button 
          onClick={onReturn}
          className="mt-6 w-full py-2 bg-[#18181b] hover:bg-black text-white text-[12px] font-normal rounded-[4px] flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Policy & Risk Monitor</span>
        </button>
      </div>
    </div>
  );
}
