import { useState }        from 'react'
import { Info, Hash, Map, GitCompare } from 'lucide-react'
import { AppShell }         from '@kern/templates/AppShell'
import { SocialBar }        from '@kern/molecules/SocialBar'
import { Colophon }         from '@kern/molecules/Colophon'
import { ViewAbout }        from '@/components/ViewAbout'
import { ViewName }         from '@/components/ViewName'
import { ViewStructure }    from '@/components/ViewStructure'
import { ViewDifference }   from '@/components/ViewDifference'
import type { ViewId }      from './types'

const NAV_ITEMS = [
  { id: 'about',      label: 'About',               icon: Info       },
  { id: 'name',       label: 'Name a colour',        icon: Hash       },
  { id: 'structure',  label: 'Map a palette',         icon: Map        },
  { id: 'difference', label: 'Compare two colours',  icon: GitCompare },
]

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('about')

  return (
    <AppShell
      logo={<img src="/hexicon.svg" alt="hexicon" className="h-5 w-auto" />}
      navItems={NAV_ITEMS}
      activeId={activeView}
      onNavigate={(id) => setActiveView(id as ViewId)}
      accentActiveClass="text-pulsar"
      social={<SocialBar siteName="hexicon" githubUrl="https://github.com/hipuku/hexicon" />}
      colophon={<Colophon name="hexicon" />}
      smallScreenNotice={
        <div className="flex flex-col gap-2 text-center max-w-xs">
          <p className="type-h4 text-ink-title">A palette needs room to breathe</p>
          <p className="type-p-sm text-ink-body">
            hexicon is desktop-only for now — it doesn't fit in your pocket. Open it on a wider screen.
          </p>
        </div>
      }
    >
      {activeView === 'about'      && <ViewAbout onNavigate={setActiveView} />}
      {activeView === 'name'       && <ViewName />}
      {activeView === 'structure'  && <ViewStructure />}
      {activeView === 'difference' && <ViewDifference />}
    </AppShell>
  )
}
