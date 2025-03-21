import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './locales'

import { store } from './store'
import { Provider } from 'react-redux'

import "./style/base.css";
import "./style/main.scss";

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
