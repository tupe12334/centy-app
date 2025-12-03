import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { InitProject } from './components/InitProject.tsx'
import { ProjectSelector } from './components/ProjectSelector.tsx'
import { CreateIssue } from './pages/CreateIssue.tsx'
import { IssuesList } from './pages/IssuesList.tsx'
import { IssueDetail } from './pages/IssueDetail.tsx'
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
          <ProjectSelector />
        </div>
        <p>Local-first issue and documentation tracker</p>
        <nav className="app-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Init
          </Link>
          <Link
            to="/issues"
            className={location.pathname.startsWith('/issues') ? 'active' : ''}
          >
            Issues
          </Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<InitProject />} />
          <Route path="/issues" element={<IssuesList />} />
          <Route path="/issues/new" element={<CreateIssue />} />
          <Route path="/issues/:issueNumber" element={<IssueDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
