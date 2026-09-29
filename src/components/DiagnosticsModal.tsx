import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Activity, Layers, Wifi } from 'lucide-react';
import { Channel, PlayerSettings } from '../types/iptv';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  settings: PlayerSettings;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  channel,
  settings,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !channel) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Stream Diagnostics & Telemetry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Stream URL */}
          <div>
            <div className="flex items-center justify-between text-neutral-400 font-semibold mb-1">
              <span>Direct Stream Manifest (.m3u8):</span>
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-mono text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-300 break-all select-all">
              {channel.url}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-neutral-500 font-medium mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Connection Mode
              </div>
              <div className="font-semibold text-white">
                {settings.useCorsProxy ? 'CORS Web Proxy' : 'Direct Native HLS'}
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-neutral-500 font-medium mb-1 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
                Low Latency Mode
              </div>
              <div className="font-semibold text-white">
                {settings.lowLatencyMode ? 'Enabled (HLS-LL)' : 'Standard Buffer'}
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-neutral-500 font-medium mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Channel EPG ID
              </div>
              <div className="font-mono text-neutral-200 truncate">
                {channel.tvgId || 'None'}
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-neutral-500 font-medium mb-1">
                Target Buffer Length
              </div>
              <div className="font-mono text-neutral-200">
                {settings.bufferLength} seconds
              </div>
            </div>
          </div>

          {/* GitHub Pages & Web Deployment Notice */}
          <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-neutral-400 leading-relaxed text-[11px]">
            <span className="font-semibold text-neutral-300 block mb-0.5">Deployment Note:</span>
            When hosted on GitHub Pages or static hosts, external streaming servers without permissive CORS headers require the built-in CORS Proxy toggle to be turned ON.
          </div>
        </div>

        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
