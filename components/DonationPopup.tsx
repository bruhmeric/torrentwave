import React, { useState } from 'react';
import { UsdtIcon, BtcIcon, ClipboardCopyIcon, CheckIcon } from './Icons';

const usdtAddress = 'TDvs92AbCaizmcorx2rdYF2pyDWiHU3E7X';
const btcAddress = '14KoMft8bjqQBhdx497gpBH6eGmzZLwEEu';

const CryptoAddress: React.FC<{
    name: string;
    address: string;
    icon: React.ReactNode;
    link: string;
    qrData: string;
}> = ({ name, address, icon, link, qrData }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const fallbackCopy = (text: string) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2500);
            } catch (err) {
                console.error('Fallback copy exception:', err);
            }
            document.body.removeChild(textArea);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(address).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2500);
            }).catch(err => {
                console.error('Failed to copy with Clipboard API, falling back.', err);
                fallbackCopy(address);
            });
        } else {
            fallbackCopy(address);
        }
    };

    return (
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
                        onClick={handleCopy}
                        className={`flex-shrink-0 flex items-center justify-center gap-2 w-28 px-3 py-2 text-sm rounded-md font-semibold transition-all duration-200 ${
                            isCopied
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        aria-label={`Copy ${name} address`}
                    >
                        {isCopied ? (
                            <><CheckIcon />Copied!</>
                        ) : (
                            <><ClipboardCopyIcon />Copy</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DonationInfo: React.FC = () => {
    return (
        <div
            className="max-w-md mx-auto my-8 p-6 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-center transition-all duration-300 animate-[fade-in_0.3s_ease-out]"
            id="donation-section"
        >
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Support with Crypto</h2>
            <p className="text-slate-400 mb-6">
                Your support helps keep the server running.
                Scan a QR code or copy an address below.
            </p>
            
            <div className="space-y-4 text-left">
                <CryptoAddress 
                    name="USDT (TRC20)"
                    address={usdtAddress}
                    icon={<UsdtIcon />}
                    link={`https://tronscan.org/#/address/${usdtAddress}`}
                    qrData={usdtAddress}
                />
                <CryptoAddress 
                    name="Bitcoin (BTC)"
                    address={btcAddress}
                    icon={<BtcIcon />}
                    link={`bitcoin:${btcAddress}`}
                    qrData={`bitcoin:${btcAddress}`}
                />
            </div>
        </div>
    );
};

export default DonationInfo;
