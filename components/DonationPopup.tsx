import React, { useState, useEffect } from 'react';
import { CloseIcon, UsdtIcon, BtcIcon, ClipboardCopyIcon, CheckIcon } from './Icons';

interface DonationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const usdtAddress = 'TDvs92AbCaizmcorx2rdYF2pyDWiHU3E7X';
const btcAddress = '14KoMft8bjqQBhdx497gpBH6eGmzZLwEEu';

const DonationPopup: React.FC<DonationPopupProps> = ({ isOpen, onClose }) => {
  const [copiedAddress, setCopiedAddress] = useState<'usdt' | 'btc' | null>(null);

  // DEBUG: Extensive logging
  useEffect(() => {
    console.log('🎪 DonationPopup Component - isOpen:', isOpen);
    console.log('🎪 DonationPopup Component - rendered in DOM');
    
    if (isOpen) {
      console.log('🚀 POPUP SHOULD BE VISIBLE!');
      console.log('🔍 Check elements tab for .fixed.inset-0 element');
    }
  }, [isOpen]);

  const handleCopy = (address: string, type: 'usdt' | 'btc') => {
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2500);
    });
  };
  
  if (!isOpen) {
    console.log('❌ DonationPopup not rendering because isOpen is false');
    return null;
  }

  console.log('✅ DonationPopup rendering now!');

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50
      }}
    >
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6 mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '28rem',
          padding: '1.5rem',
          margin: '0 1rem',
          textAlign: 'center'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-slate-400 rounded-full hover:text-sky-400 hover:bg-slate-700 transition-colors z-10"
          aria-label="Close donation popup"
        >
          <CloseIcon />
        </button>
        <h2 id="donation-title" className="text-2xl font-bold text-slate-100 mb-2">Support with Crypto</h2>
        <p className="text-slate-400 mb-6">
          Your support helps keep the server running.
          Scan a QR code or copy an address below.
        </p>
        
        <div className="space-y-4 text-left">
            <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 text-center">
                <div className="flex items-center justify-center mb-3">
                    <UsdtIcon />
                    <h3 className="text-lg font-semibold text-slate-200 ml-3">USDT (TRC20)</h3>
                </div>
                
                <div className="bg-white p-1 rounded-md inline-block mb-3">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(usdtAddress)}&qzone=1`}
                    alt="USDT QR Code"
                    width="128"
                    height="128"
                    className="block"
                  />
                </div>

                <div className="bg-slate-950 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                      <span className="text-sm text-sky-400 break-all flex-grow text-left">
                        {usdtAddress}
                      </span>
                      <button
                          onClick={() => handleCopy(usdtAddress, 'usdt')}
                          className={`flex-shrink-0 flex items-center justify-center gap-2 w-28 px-3 py-2 text-sm rounded-md font-semibold ${
                              copiedAddress === 'usdt'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-slate-700 text-slate-300'
                          }`}
                          aria-label="Copy USDT address"
                      >
                          {copiedAddress === 'usdt' ? (
                              <><CheckIcon />Copied!</>
                          ) : (
                              <><ClipboardCopyIcon />Copy</>
                          )}
                      </button>
                  </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DonationPopup;
