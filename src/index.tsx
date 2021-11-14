import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './App'
import FirebaseProvider from './adapters/firebase'
import UserProvider from './adapters/user'

ReactDOM.render(
  <FirebaseProvider>
    <UserProvider>
      <App />
    </UserProvider>
  </FirebaseProvider>,
  document.getElementById('root')
)
