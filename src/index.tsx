import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './App'
import FirebaseProvider from './adapters/firebase'
import UserProvider from './adapters/user'

const root = document.createElement('div')
root.id = 'root'
root.classList.add('h-full')
document.body.prepend(root)

ReactDOM.render(
  <FirebaseProvider>
    <UserProvider>
      <App />
    </UserProvider>
  </FirebaseProvider>,
  root
)
