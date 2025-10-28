import React, { useState } from 'react';
import { CloseIcon, UsdtIcon, BtcIcon, ClipboardCopyIcon, CheckIcon } from './Icons';

interface DonationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const usdtAddress = 'TDvs92AbCaizmcorx2rdYF2pyDWiHU3E7X';
const btcAddress = '14KoMft8bjqQBhdx497gpBH6eGmzZLwEEu';

const DonationPopup: React.FC<DonationPopupProps> = ({ isOpen, onClose }) => {
  const [copiedAddress, setCopiedAddress] = useState<'usdt' | 'btc' | null>(null);

  const handleCopy = (address: string, type: 'usdt' | 'btc') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(type);
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2500);
    }
  };
  
  if (!isOpen) {
    return null;
  }

  const CryptoAddress: React.FC<{
      type: 'usdt' | 'btc';
      name: string;
      address: string;
      icon: React.ReactNode;
  }> = ({ type, name, address, icon }) => (
      <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center mb-2">
              {icon}
              <h3 className="text-lg font-semibold text-slate-200 ml-3">{name}</h3>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-md">
              <code className="text-sm text-sky-300 break-all flex-grow">{address}</code>
              <button
                  onClick={() => handleCopy(address, type)}
                  className={`flex items-center justify-center gap-2 w-28 px-3 py-2 text-sm rounded-md font-semibold transition-all duration-200 ${
                      copiedAddress === type
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  aria-label={`Copy ${name} address`}
              >
                  {copiedAddress === type ? (
                      <>
                          <CheckIcon />
                          Copied!
                      </>
                  ) : (
                      <>
                          <ClipboardCopyIcon />
                          Copy
                      </>
                  )}
              </button>
          </div>
      </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center transition-opacity duration-300 animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-title"
    >
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6 mx-4 text-center transform transition-all duration-300 scale-95 animate-[zoom-in_0.3s_ease-out_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-slate-400 rounded-full hover:text-sky-400 hover:bg-slate-700 transition-colors"
          aria-label="Close donation popup"
        >
          <CloseIcon />
        </button>
        <h2 id="donation-title" className="text-2xl font-bold text-slate-100 mb-2">Support with Crypto</h2>
        <p className="text-slate-400 mb-6">
          Your support helps keep the server running.
          All donations are greatly appreciated!
        </p>
        
        <div className="space-y-4 text-left">
            <CryptoAddress 
                type="usdt"
                name="USDT (TRC20)"
                address={usdtAddress}
                icon={<UsdtIcon />}
            />
            <CryptoAddress 
                type="btc"
                name="Bitcoin (BTC)"
                address={btcAddress}
                icon={<BtcIcon />}
            />
        </div>

      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes zoom-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
       `}</style>
    </div>
  );
};

export default DonationPopup;
