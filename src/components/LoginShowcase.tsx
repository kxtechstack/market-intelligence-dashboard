import React from "react";
import abstractBg from "../assets/images/abstract_login_bg_1794502665017.jpg";

export default function LoginShowcase() {
  return (
    <div className="relative w-full h-full bg-[#f8fafc] overflow-hidden select-none">
      <img
        src={abstractBg}
        alt="Abstract background"
        className="w-full h-full object-cover object-center block"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
