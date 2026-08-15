import { useState }        from 'react'
import { Info, Hash, Map, GitCompare } from 'lucide-react'
import { AppSidebar }      from '@kern/organisms/AppSidebar'
import { HipukuLogo }      from '@kern/atoms/HipukuLogo'
import { SocialBar }       from '@kern/molecules/SocialBar'
import { ViewAbout }       from '@/components/ViewAbout'
import { ViewName }        from '@/components/ViewName'
import { ViewStructure }   from '@/components/ViewStructure'
import { ViewDifference }  from '@/components/ViewDifference'
import type { ViewId }     from './types'

const NAV_ITEMS = [
  { id: 'about',      label: 'About',               icon: Info       },
  { id: 'name',       label: 'Name a colour',        icon: Hash       },
  { id: 'structure',  label: 'Map a palette',         icon: Map        },
  { id: 'difference', label: 'Compare two colours',  icon: GitCompare },
]

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('about')
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar
        logo={<img src="/hexicon.svg" alt="hexicon" className="h-5 w-auto" />}
        navItems={NAV_ITEMS}
        activeId={activeView}
        onNavigate={(id) => setActiveView(id as ViewId)}
        accentActiveClass="text-pulsar"
        social={<SocialBar siteName="hexicon" githubUrl="https://github.com/hipuku/hexicon" />}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(o => !o)}
        colophon={
          <div className="flex items-center gap-2">
            <span>2026 © hexicon by</span>
            <HipukuLogo />
          </div>
        }
      />

      <main className="flex-1 h-full overflow-y-auto p-10">
        {activeView === 'about'      && <ViewAbout onNavigate={setActiveView} />}
        {activeView === 'name'       && <ViewName />}
        {activeView === 'structure'  && <ViewStructure />}
        {activeView === 'difference' && <ViewDifference />}
      </main>
    </div>
  )
}
