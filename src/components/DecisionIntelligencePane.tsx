export default function DecisionIntelligencePane({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="flex-1 h-full bg-zinc-50 flex items-center justify-center p-8 select-none">
      <div className="max-w-md w-full bg-white border border-zinc-200 p-6 rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-center flex flex-col items-center">
        <h3 className="text-base font-medium text-zinc-900 mb-1">
          Decision Intelligence
        </h3>
        <p className="text-[12.5px] text-zinc-500 leading-relaxed mb-6">
          This Decision Intelligence workspace is being configured.
        </p>
        <button 
          onClick={onReturn}
          className="py-1.5 px-4 border border-zinc-200 bg-[#fbfbfb] text-zinc-700 text-[11.5px] font-normal rounded-[4px] hover:bg-zinc-50"
        >
          Go to policy & risk monitor
        </button>
      </div>
    </div>
  );
}
