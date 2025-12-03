import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { InitProject } from './components/InitProject.tsx'
import { ProjectSelector } from './components/ProjectSelector.tsx'
import { DaemonStatusIndicator } from './components/DaemonStatusIndicator.tsx'
import { CreateIssue } from './pages/CreateIssue.tsx'
import { IssuesList } from './pages/IssuesList.tsx'
import { IssueDetail } from './pages/IssueDetail.tsx'
import { ArchivedProjects } from './pages/ArchivedProjects.tsx'
import { DocsList } from './pages/DocsList.tsx'
import { DocDetail } from './pages/DocDetail.tsx'
import { CreateDoc } from './pages/CreateDoc.tsx'
import { Settings } from './pages/Settings.tsx'
import { SharedAssets } from './pages/SharedAssets.tsx'
import './App.css'

function App() {
  const location = useLocation()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>
            <Link to="/">Centy</Link>
          </h1>
          <div className="header-controls">
            <DaemonStatusIndicator />
            <ProjectSelector />
          </div>
        </div>
        <p>Local-first issue and documentation tracker</p>
        <nav className="app-nav">
          <Link
            to="/issues"
            className={location.pathname.startsWith('/issues') ? 'active' : ''}
          >
            Issues
          </Link>
          <Link
            to="/docs"
            className={location.pathname.startsWith('/docs') ? 'active' : ''}
          >
            Docs
          </Link>
          <Link
            to="/assets"
            className={location.pathname === '/assets' ? 'active' : ''}
          >
            Assets
          </Link>
          <Link
            to="/settings"
            className={location.pathname === '/settings' ? 'active' : ''}
          >
            Settings
          </Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<InitProject />} />
          <Route path="/issues" element={<IssuesList />} />
          <Route path="/issues/new" element={<CreateIssue />} />
          <Route path="/issues/:issueNumber" element={<IssueDetail />} />
          <Route path="/docs" element={<DocsList />} />
          <Route path="/docs/new" element={<CreateDoc />} />
          <Route path="/docs/:slug" element={<DocDetail />} />
          <Route path="/assets" element={<SharedAssets />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/archived" element={<ArchivedProjects />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
