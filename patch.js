const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. In TopMenuBar: logo click handler should switch to decision_intelligence if logged in, or reset if logged out
const oldLogo = `<div 
        onClick={() => onTabChange("decision_intelligence")} 
        className="flex items-center gap-2.5 cursor-pointer group select-none"
        title="REUI Dashboard"
      >`;

const newLogo = `<div 
        onClick={() => onTabChange(isLoggedIn ? "decision_intelligence" : "login")} 
        className="flex items-center gap-2.5 cursor-pointer group select-none"
        title="REUI Dashboard"
      >`;

// 2. In App.tsx: when !isLoggedIn and activeTab === "support", render SupportPane so clicking Support works seamlessly!
const oldLoggedOut = `      <div className="flex-1 w-full flex overflow-hidden">
        {!isLoggedIn ? (
          <div className="w-full h-full flex flex-col md:flex-row bg-[#fafafa] select-text overflow-hidden">`;

const newLoggedOut = `      <div className="flex-1 w-full flex overflow-hidden">
        {!isLoggedIn ? (
          activeTab === "support" ? (
            <div className="w-full h-full flex flex-col overflow-hidden bg-zinc-50">
              <SupportPane onReturn={() => setActiveTab("login")} />
            </div>
          ) : (
          <div className="w-full h-full flex flex-col md:flex-row bg-[#fafafa] select-text overflow-hidden">`;

// Also close the conditional for activeTab === "support" before the closing tag of !isLoggedIn
const oldLoggedOutEnd = `            {/* Support Contact Modal */}
            {showSupportContactModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white rounded-[6px] border border-zinc-200 p-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-zinc-900">Contact Support</h3>
                    <button 
                      onClick={() => setShowSupportContactModal(false)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[12px] text-zinc-600 mb-4 leading-relaxed">
                    Need assistance accessing your workspace or managing your enterprise credentials?
                  </p>
                  <div className="space-y-2.5 text-[12.5px] bg-zinc-50 p-3.5 rounded-[4px] border border-zinc-200 mb-4">
                    <div>
                      <span className="text-zinc-500 text-[11px] block uppercase tracking-wider font-medium">Enterprise Desk</span>
                      <a href="mailto:support@knometrix.com" className="text-zinc-900 font-medium hover:underline">
                        support@knometrix.com
                      </a>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[11px] block uppercase tracking-wider font-medium">Availability</span>
                      <span className="text-zinc-700">24/7 Priority Support Coverage</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSupportContactModal(false)}
                    className="w-full h-9 bg-zinc-900 hover:bg-black text-white text-[12.5px] font-medium rounded-[4px] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (`;

const newLoggedOutEnd = `            {/* Support Contact Modal */}
            {showSupportContactModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white rounded-[6px] border border-zinc-200 p-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-zinc-900">Contact Support</h3>
                    <button 
                      onClick={() => setShowSupportContactModal(false)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[12px] text-zinc-600 mb-4 leading-relaxed">
                    Need assistance accessing your workspace or managing your enterprise credentials?
                  </p>
                  <div className="space-y-2.5 text-[12.5px] bg-zinc-50 p-3.5 rounded-[4px] border border-zinc-200 mb-4">
                    <div>
                      <span className="text-zinc-500 text-[11px] block uppercase tracking-wider font-medium">Enterprise Desk</span>
                      <a href="mailto:support@knometrix.com" className="text-zinc-900 font-medium hover:underline">
                        support@knometrix.com
                      </a>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[11px] block uppercase tracking-wider font-medium">Availability</span>
                      <span className="text-zinc-700">24/7 Priority Support Coverage</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSupportContactModal(false)}
                    className="w-full h-9 bg-zinc-900 hover:bg-black text-white text-[12.5px] font-medium rounded-[4px] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          )
        ) : (`;

let replacedCount = 0;
if (code.includes(oldLogo)) {
  code = code.replace(oldLogo, newLogo);
  replacedCount++;
}
if (code.includes(oldLoggedOut)) {
  code = code.replace(oldLoggedOut, newLoggedOut);
  replacedCount++;
}
if (code.includes(oldLoggedOutEnd)) {
  code = code.replace(oldLoggedOutEnd, newLoggedOutEnd);
  replacedCount++;
}

console.log('Replaced count:', replacedCount);
if (replacedCount === 3) {
  fs.writeFileSync('src/App.tsx', code, 'utf8');
  console.log('PATCH SUCCESS');
} else {
  console.log('PATCH FAILED');
}
