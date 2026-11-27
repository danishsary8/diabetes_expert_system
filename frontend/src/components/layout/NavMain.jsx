import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({ title, items, collapsed = false }) {
  if (!items?.length) return null

  return (
    <SidebarGroup className="space-y-1">
      {!collapsed && title ? (
        <SidebarGroupLabel className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {title}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <SidebarMenuItem key={item.to}>
              <NavLink
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    collapsed ? 'h-10 w-10 justify-center mx-auto' : 'gap-2.5 px-2.5 py-1.5',
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-cyan-50/70 text-primary-800 font-semibold shadow-xs dark:from-primary-500/15 dark:to-cyan-500/10 dark:text-primary-200'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active item marker */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600 dark:bg-primary-400 transition-all duration-200" />
                    )}

                    {/* Consistent icon container */}
                    {Icon ? (
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
                          isActive
                            ? 'bg-gradient-to-br from-primary-500 to-cyan-500 text-white shadow-sm shadow-primary-500/30'
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    ) : null}

                    {!collapsed ? (
                      <span className="truncate tracking-normal text-[13.5px] leading-5">
                        {item.label}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

