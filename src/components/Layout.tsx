import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Clock,
  Info,
  LayoutDashboard,
  MapPin,
  Menu,
  Mic,
  PhoneCall,
  Route,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { SOSButton } from './SOSButton';
import { SOSConfirmationModal } from './SOSConfirmationModal';

interface NavGroup {
  label: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Core Safety',
    items: [
      { to: '/', label: 'Safety Dashboard', icon: LayoutDashboard },
      { to: '/sos', label: 'Emergency SOS', icon: ShieldAlert },
      { to: '/location', label: 'Live Location', icon: MapPin },
      { to: '/journey', label: 'Safe Journey', icon: Route },
    ],
  },
  {
    label: 'Sensors & ML',
    items: [
      { to: '/movement', label: 'Movement Monitor', icon: Activity },
      { to: '/ml-lab', label: 'ML Analysis Lab', icon: BrainCircuit },
      { to: '/voice', label: 'Voice Detection', icon: Mic },
      { to: '/shake', label: 'Shake-to-Alert', icon: Smartphone },
    ],
  },
  {
    label: 'Assistance & Contacts',
    items: [
      { to: '/fake-call', label: 'Fake Call', icon: PhoneCall },
      { to: '/contacts', label: 'Emergency Contacts', icon: Users },
    ],
  },
  {
    label: 'Records & System',
    items: [
      { to: '/history', label: 'Alert History', icon: Clock },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/about', label: 'About Project', icon: Info },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Safety Dashboard',
  '/sos': 'Emergency SOS',
  '/location': 'Live Location',
  '/movement': 'Movement Monitoring',
  '/ml-lab': 'ML Analysis Lab',
  '/voice': 'Voice Emergency Detection',
  '/shake': 'Shake-to-Alert',
  '/journey': 'Safe Journey',
  '/fake-call': 'Fake Call',
  '/contacts': 'Emergency Contacts',
  '/history': 'Alert History',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings & Privacy',
  '/about': 'About Project',
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {
    storageNotice,
    dismissStorageNotice,
    unusualMovementWarning,
    dismissUnusualWarning,
    activeJourney,
    checkInJourney,
    requestSosConfirmation,
  } = useSafety();

  const currentTitle = ROUTE_TITLES[location.pathname] ?? 'Safety Platform';

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-purple-100 flex items-center justify-between">
        <NavLink
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 text-[#1E1B2E] whitespace-nowrap shrink-0"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-rose-500 text-white shadow-sm">
            <Shield className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            AegisGuard
          </span>
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-purple-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav
        aria-label="Primary Navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-2 text-xs font-semibold text-[#6D6684]">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-purple-100/80 text-purple-900 border border-purple-200'
                            : 'text-[#4B4560] hover:text-[#1E1B2E] hover:bg-purple-50/70 border border-transparent'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-purple-100 text-xs text-[#5B5570]">
        <div className="font-medium text-[#342E49]">Local-First Personal Safety</div>
        <div className="mt-0.5 text-[#6D6684]">
          Private · User-confirmed SOS
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8FC] text-[#1E1B2E] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 bg-white border-r border-[#EAE4F2] sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#1E1B2E]/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-[#EAE4F2] h-full z-50 shadow-xl">
            {navContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 bg-white/90 backdrop-blur border-b border-[#EAE4F2] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-[#4B4560] hover:text-[#1E1B2E] hover:bg-purple-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-[#6D6684] whitespace-nowrap">
                AegisGuard
              </span>
              <span className="hidden sm:inline text-purple-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-[#1E1B2E] truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          <SOSButton variant="compact" />
        </header>

        {/* Global Actionable Alerts */}
        <div className="px-4 sm:px-8 pt-4 space-y-3 max-w-[1360px] w-full mx-auto">
          {storageNotice && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>{storageNotice}</span>
              </div>
              <button
                type="button"
                onClick={dismissStorageNotice}
                className="text-amber-800 hover:text-amber-950 font-medium underline whitespace-nowrap cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {unusualMovementWarning && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-sm text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
                <span>{unusualMovementWarning}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dismissUnusualWarning();
                    requestSosConfirmation({
                      source: 'MOVEMENT_ML',
                      title: 'Confirm SOS After Unusual Movement',
                      description:
                        'The Random Forest classifier flagged an unusual movement pattern. ML cannot verify an emergency—please confirm only if you need help.',
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
                >
                  Activate SOS
                </button>
                <button
                  type="button"
                  onClick={dismissUnusualWarning}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-xs font-medium text-amber-950 whitespace-nowrap cursor-pointer"
                >
                  I Am Safe
                </button>
              </div>
            </div>
          )}

          {activeJourney?.status === 'CHECKIN_OVERDUE' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="text-sm text-rose-950">
                <span className="font-semibold">Safe Journey Check-In Overdue:</span>{' '}
                Are you safe on your way to {activeJourney.destination}?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={checkInJourney}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
                >
                  Confirm I Am Safe
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestSosConfirmation({
                      source: 'JOURNEY_CHECKIN',
                      title: 'Confirm SOS During Safe Journey',
                      description: `Confirm manual SOS activation for your journey to ${activeJourney.destination}.`,
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
                >
                  Trigger SOS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>

      <SOSConfirmationModal />
    </div>
  );
};
