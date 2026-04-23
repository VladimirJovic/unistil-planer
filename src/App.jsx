import { useStore } from './store/useStore'
import LoginScreen from './components/LoginScreen'
import ProjectsScreen from './components/ProjectsScreen'
import SetupScreen from './components/SetupScreen'
import Planner from './components/Planner'

// ─────────────────────────────────────────────────────────────
// Ruting:
//   not logged in           → LoginScreen
//   logged in, no project   → ProjectsScreen (kreiraj / otvori)
//   project + setupDone=false → SetupScreen (dimenzije za novi projekat)
//   project + setupDone=true  → Planner
// ─────────────────────────────────────────────────────────────
export default function App() {
  const user             = useStore(s => s.user)
  const currentProjectId = useStore(s => s.currentProjectId)
  const setupDone        = useStore(s => s.setupDone)

  if (!user) return <LoginScreen />
  if (!currentProjectId) return <ProjectsScreen />
  if (!setupDone) return <SetupScreen />
  return <Planner />
}
