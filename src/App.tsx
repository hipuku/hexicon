import { useState } from 'react'
import { AppSidebar, type ViewId } from '@/components/AppSidebar'
import { ViewAbout }   from '@/components/ViewAbout'
import { ViewName }    from '@/components/ViewName'
import { ViewPalette } from '@/components/ViewPalette'
import { ViewContext } from '@/components/ViewContext'

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('about')

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar activeView={activeView} onNavigate={setActiveView} />

      <main className="flex-1 overflow-y-auto p-10">
        {activeView === 'about'   && <ViewAbout onNavigate={setActiveView} />}
        {activeView === 'name'    && <ViewName />}
        {activeView === 'palette' && <ViewPalette />}
        {activeView === 'context' && <ViewContext />}
      </main>
    </div>
  )
}
