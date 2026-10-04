import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './context/AuthContext';
import { ParticipantProvider } from './context/ParticipantContext';
import { ChallengeProvider } from './context/ChallengeContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <ParticipantProvider>
          <ChallengeProvider>
            <App />
          </ChallengeProvider>
        </ParticipantProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
