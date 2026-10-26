import React from "react";
import showcaseCardImg from "../assets/images/login_showcase_card_1791870415818.jpg";

export default function LoginShowcase() {
  return (
    <div className="relative w-full h-full bg-[#f9fafb] border-r border-zinc-200 overflow-hidden flex flex-col items-center justify-center p-8 lg:p-12 select-none">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Formatted showcase image card - smaller, clean borders, crisp format */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl border border-zinc-200/90 shadow-sm overflow-hidden transition-all duration-300 hover:border-zinc-300">
        <img
          src={showcaseCardImg}
          alt="Market Intelligence Workspace Dashboard"
          className="w-full h-auto object-contain block"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
