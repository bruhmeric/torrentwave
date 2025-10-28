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
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2500);
    });
  };
  
  if (!isOpen) {
    return null;
  }

  const CryptoAddress: React.FC<{
      type: 'usdt' | 'btc';
      name: string;
      address: string;
      icon: React.ReactNode;
      link: string;
      qrData: string;
  }> = ({ type, name, address, icon, link, qrData }) => (
      <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 text-center">
          <div className="flex items-center justify-center mb-3">
              {icon}
              <h3 className="text-lg font-semibold text-slate-200 ml-3">{name}</h3>
          </div>
          
          <div className="bg-white p-1 rounded-md inline-block mb-3">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(qrData)}&qzone=1`}
              alt={`${name} QR Code`}
              width="128"
              height="128"
              className="block"
            />
          </div>

          <div className="bg-slate-950 p-2 rounded-md">
            <div className="flex items-center gap-2">
                <a 
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-400 break-all flex-grow text-left hover:underline"
                  title={`View ${name} address details`}
                >
                  {address}
                </a>
                <button
                    onClick={() => handleCopy(address, type)}
                    className={`flex-shrink-0 flex items-center justify-center gap-2 w-28 px-3 py-2 text-sm rounded-md font-semibold transition-all duration-200 ${
                        copiedAddress === type
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    aria-label={`Copy ${name} address`}
                >
                    {copiedAddress === type ? (
                        <><CheckIcon />Copied!</>
                    ) : (
                        <><ClipboardCopyIcon />Copy</>
                    )}
                </button>
            </div>
          </div>
      </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center transition-opacity duration-300 animate-[fade-in_0.3s_ease-out]"
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
            <CryptoAddress 
                type="usdt"
                name="USDT (TRC20)"
                address={usdtAddress}
                icon={<UsdtIcon />}
                link={`https://tronscan.org/#/address/${usdtAddress}`}
                qrData={usdtAddress}
            />
            <CryptoAddress 
                type="btc"
                name="Bitcoin (BTC)"
                address={btcAddress}
                icon={<BtcIcon />}
                link={`bitcoin:${btcAddress}`}
                qrData={`bitcoin:${btcAddress}`}
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