'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { WalletConnection } from './WalletConnection';
import { 
  Home, 
  ShoppingCart, 
  Briefcase, 
  RotateCcw, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Rebalancer', href: '/rebalancer', icon: RotateCcw },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const getCurrentPageName = () => {
    const currentItem = navigationItems.find(item => item.href === pathname);
    return currentItem?.name || 'Dashboard';
  };

  return (
    <>
      <nav className="bg-card-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="bg-accent text-white px-3 py-1 rounded font-bold hover:bg-accent/90 transition-colors">
                  DLMM
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-1">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={clsx(
                          'group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative',
                          isActive
                            ? 'text-accent bg-accent/10 shadow-sm'
                            : 'text-text-secondary hover:text-foreground hover:bg-background/80'
                        )}
                      >
                        <Icon className={clsx(
                          'w-4 h-4 mr-2 transition-colors',
                          isActive ? 'text-accent' : 'text-text-secondary group-hover:text-foreground'
                        )} />
                        {item.name}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Breadcrumb */}
              <div className="md:hidden ml-4 flex items-center text-sm text-text-secondary">
                <Home className="w-4 h-4" />
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-foreground font-medium">{getCurrentPageName()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Desktop Wallet Connection */}
              <div className="hidden md:block">
                <WalletConnection />
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-foreground hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div className={clsx(
        'md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out',
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="bg-accent text-white px-3 py-1 rounded font-bold">
              DLMM
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-text-secondary hover:text-foreground hover:bg-background/80 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group flex items-center w-full px-4 py-3 rounded-lg text-base font-medium transition-all duration-200',
                    isActive
                      ? 'text-accent bg-accent/10 shadow-sm'
                      : 'text-text-secondary hover:text-foreground hover:bg-background/80'
                  )}
                >
                  <Icon className={clsx(
                    'w-5 h-5 mr-3 transition-colors',
                    isActive ? 'text-accent' : 'text-text-secondary group-hover:text-foreground'
                  )} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Wallet Connection */}
          <div className="p-4 border-t border-border">
            <WalletConnection />
          </div>
        </div>
      </div>
    </>
  );
};