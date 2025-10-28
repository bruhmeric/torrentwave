import React, { useState } from 'react';
import { CryptoIcon, UsdtIcon, BtcIcon, ClipboardCopyIcon, CheckIcon, CloseIcon } from './Icons';

interface CryptoAddressProps {
    name: string;
    address: string;
    icon: React.ReactNode;
    qrData: string;
}

const CryptoAddress: React.FC<CryptoAddressProps> = ({ name, address, icon, qrData }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!address) return;

        const fallbackCopy = (text: string) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus(); textArea.select();
            try { document.execCommand('copy'); setCopiedState(); } catch (err) { console.error('Fallback copy failed', err); }
            document.body.removeChild(textArea);
        };

        const setCopiedState = () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(address).then(setCopiedState).catch(() => fallbackCopy(address));
        } else {
            fallbackCopy(address);
        }
    };

    return (
        <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700 text-center">
            <div className="flex items-center justify-center mb-2">
                {icon}
                <h3 className="text-md font-semibold text-slate-200 ml-2">{name}</h3>
            </div>
            <div className="bg-white p-1 rounded-md inline-block mb-2">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}&qzone=1`} alt={`${name} QR Code`} width="100" height="100" className="block" />
            </div>
            <div className="bg-slate-950 p-1.5 rounded-md">
                <div className="flex items-center gap-2">
                    <p className="text-xs text-sky-400 break-all flex-grow text-left pl-1" title={address}>{address}</p>
                    <button 
                        onClick={handleCopy} 
                        className={`flex-shrink-0 flex items-center justify-center gap-1.5 w-24 px-2 py-1.5 text-xs rounded-md font-semibold transition-all duration-200 ${
                            copied 
                            ? 'bg-green-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        aria-label={`Copy ${name} address`}
                    >
                        {copied ? (
                            <>
                                <CheckIcon />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <ClipboardCopyIcon />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


const DonationWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* The Panel */}
            <div 
                className={`fixed bottom-24 right-5 max-w-xs w-full p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-center transition-all duration-300 ease-out z-40 ${
                    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
                role="dialog"
                aria-modal="true"
                aria-hidden={!isOpen}
            >
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-2 right-2 p-1 text-slate-500 rounded-full hover:bg-slate-700 hover:text-slate-200 transition-colors"
                    aria-label="Close donation info"
                >
                    <CloseIcon />
                </button>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Support Us</h2>
                <p className="text-xs text-slate-400 mb-4">Your support helps keep the server running.</p>
                
                <div className="space-y-3 text-left">
                     <CryptoAddress 
                        name="USDT (TRC20)"
                        address="TDvs92AbCaizmcorx2rdYF2pyDWiHU3E7X"
                        icon={<UsdtIcon className="w-6 h-6"/>}
                        qrData="TDvs92AbCaizmcorx2rdYF2pyDWiHU3E7X"
                    />
                    <CryptoAddress 
                        name="Bitcoin (BTC)"
                        address="14KoMft8bjqQBhdx497gpBH6eGmzZLwEEu"
                        icon={<BtcIcon className="w-6 h-6"/>}
                        qrData="bitcoin:14KoMft8bjqQBhdx497gpBH6eGmzZLwEEu"
                    />
                </div>
            </div>

            {/* The Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-5 right-5 px-4 py-2 bg-sky-600 text-white rounded-md shadow-lg flex items-center justify-center hover:bg-sky-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-500/50 z-50 font-semibold"
                aria-label="Toggle support panel"
                aria-expanded={isOpen}
            >
                support us ❤️
            </button>
        </>
    );
};

export default DonationWidget;