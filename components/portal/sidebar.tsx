'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Business } from '@/lib/types/database'
import { 
  Zap, 
  Calculator, 
  Users, 
  Settings,
  Code,
} from 'lucide-react'

interface PortalSidebarProps {
  business: Business
}

const navItems = [
  {
    label: 'Instant Estimator',
    href: '/portal/estimator',
    icon: Calculator,
    description: 'Configure pricing tiers',
  },
  {
    label: 'Leads',
    href: '/portal/leads',
    icon: Users,
    description: 'View captured leads',
  },
  {
    label: 'Widget',
    href: '/portal/widget',
    icon: Code,
    description: 'Get embed code',
  },
  {
    label: 'Settings',
    href: '/portal/settings',
    icon: Settings,
    description: 'Integrations & profile',
  },
]

export function PortalSidebar({ business }: PortalSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <Zap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground leading-tight">
              HVAC Quotes
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
              {business.name}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5',
                isActive ? 'text-sidebar-primary' : ''
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sidebar-accent/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Widget Active</span>
        </div>
      </div>
    </aside>
  )
}
