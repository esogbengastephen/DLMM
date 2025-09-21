'use client';

import { useTheme } from '@/contexts/ThemeProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Settings, Moon, Sun, Bell, MessageSquare, Wallet } from 'lucide-react';

// Dynamic import to prevent SSR hydration mismatch
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => ({ default: mod.WalletMultiButton })),
  {
    ssr: false,
    loading: () => (
      <button className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-medium">
        Loading Wallet...
      </button>
    ),
  }
);

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { publicKey, connected } = useWallet();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="grid gap-6">
          {/* Wallet Section */}
          <div className="bg-card-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold">Wallet</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {connected ? 'Wallet 1 - Connected' : 'No Wallet Connected'}
                  </p>
                  {publicKey && (
                    <p className="text-sm text-text-secondary mt-1">
                      {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {connected && (
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <WalletMultiButton className="!bg-accent hover:!bg-accent/90 !text-white !rounded-lg !px-4 !py-2 !text-sm !font-medium" />
                </div>
              </div>
            </div>
          </div>

          {/* Theme Section */}
          <div className="bg-card-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              {theme === 'dark' ? (
                <Moon className="w-6 h-6 text-accent" />
              ) : (
                <Sun className="w-6 h-6 text-accent" />
              )}
              <h2 className="text-xl font-semibold">Theme</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Appearance</p>
                  <p className="text-sm text-text-secondary">Choose your preferred theme</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="light"
                      name="theme"
                      checked={theme === 'light'}
                      onChange={() => theme !== 'light' && toggleTheme()}
                      className="w-4 h-4 text-accent bg-card-background border-border focus:ring-accent focus:ring-2"
                    />
                    <label htmlFor="light" className="text-sm font-medium cursor-pointer">
                      Light
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="dark"
                      name="theme"
                      checked={theme === 'dark'}
                      onChange={() => theme !== 'dark' && toggleTheme()}
                      className="w-4 h-4 text-accent bg-card-background border-border focus:ring-accent focus:ring-2"
                    />
                    <label htmlFor="dark" className="text-sm font-medium cursor-pointer">
                      Dark
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-card-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-text-secondary">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Telegram Notifications</p>
                  <p className="text-sm text-text-secondary">Receive updates via Telegram</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-card-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold">Additional Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-refresh Data</p>
                  <p className="text-sm text-text-secondary">Automatically refresh portfolio data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sound Notifications</p>
                  <p className="text-sm text-text-secondary">Play sounds for important events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}