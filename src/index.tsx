import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import FirebaseProvider from './adapters/firebase'
import UserProvider from './adapters/user'
import App from './App'
import { AlertProvider } from './components/Alert'
import { EditorProvider } from './context/EditorContext'
import './styles/index.css'

const root = document.createElement('div')
root.id = 'root'
document.body.prepend(root)

ReactDOM.render(
  <StrictMode>
    <FirebaseProvider>
      <AlertProvider>
        <UserProvider>
          <EditorProvider>
            <App />
          </EditorProvider>
        </UserProvider>
      </AlertProvider>
    </FirebaseProvider>
  </StrictMode>,
  root
)
