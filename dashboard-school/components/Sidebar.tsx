'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  Settings,
  BarChart3,
  FileText,
  CreditCard,
  Shield,
  CalendarDays,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Élèves',
    href: '/dashboard/students',
    icon: Users
  },
  {
    title: 'Classes',
    href: '/dashboard/classes',
    icon: BookOpen
  },
  {
    title: 'Enseignants',
    href: '/dashboard/teachers',
    icon: GraduationCap
  },
  {
    title: 'Paiements',
    href: '/dashboard/payments',
    icon: CreditCard
  },
  {
    title: 'Agents',
    href: '/dashboard/agents',
    icon: Shield
  },
  {
    title: 'Années Académiques',
    href: '/dashboard/academic-years',
    icon: CalendarDays
  },
  {
    title: 'Import Élèves',
    href: '/dashboard/import',
    icon: Upload
  },
  {
    title: 'Présences',
    href: '/dashboard/attendance',
    icon: Calendar
  },
  {
    title: 'Notes',
    href: '/dashboard/grades',
    icon: FileText
  },
  {
    title: 'Statistiques',
    href: '/dashboard/statistics',
    icon: BarChart3
  },
  {
    title: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <BookOpen className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Scolarité BF</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
