'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import clsx from 'clsx';

interface BreadcrumbItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  className?: string;
  showHome?: boolean;
}

const pathToNameMap: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/portfolio': 'Portfolio',
  '/rebalancer': 'Rebalancer',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  className,
  showHome = true 
}) => {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always add home if showHome is true
    if (showHome) {
      breadcrumbs.push({
        name: 'Home',
        href: '/',
        icon: Home
      });
    }

    // If we're on the home page, return just home
    if (pathname === '/') {
      return showHome ? breadcrumbs : [{ name: 'Dashboard', href: '/' }];
    }

    // Build breadcrumbs for nested paths
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = pathToNameMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        name,
        href: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1 && pathname === '/') {
    return null;
  }

  return (
    <nav className={clsx('flex items-center space-x-1 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-text-secondary mx-1 flex-shrink-0" />
              )}
              
              {isLast ? (
                <span className="flex items-center text-foreground font-medium">
                  {Icon && <Icon className="w-4 h-4 mr-1" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center text-text-secondary hover:text-foreground transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4 mr-1" />}
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;