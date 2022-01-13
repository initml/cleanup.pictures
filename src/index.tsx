import React from 'react'
import ReactDOM from 'react-dom'
import FirebaseProvider from './adapters/firebase'
import UserProvider from './adapters/user'
import App from './App'
import './styles/index.css'

const root = document.createElement('div')
root.id = 'root'
document.body.prepend(root)

ReactDOM.render(
  <React.StrictMode>
    <FirebaseProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </FirebaseProvider>
  </React.StrictMode>,
  root
)
