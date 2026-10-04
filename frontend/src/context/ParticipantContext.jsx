import React, { createContext, useContext, useMemo } from 'react';
import { useAuthContext } from './AuthContext';
import { participantApi } from '../services/participantApi';
import { clearCompetitionStorage } from '../utils/constants';

const ParticipantContext = createContext(null);

export function ParticipantProvider({ children }) {
  const { user, setAuthSession, logout } = useAuthContext() || {};

  // Participant identity is strictly derived from the authenticated user token
  const participant = useMemo(() => {
    if (!user) return null;
    if (user.role === 'participant' || user.participantId) {
      return {
        id: user.id || user._id,
        _id: user._id || user.id,
        name: user.name,
        participantId: user.participantId,
        email: user.email,
        college: user.college || '',
        department: user.department || '',
        role: 'participant',
      };
    }
    return null;
  }, [user]);

  const registerParticipant = async (details) => {
    // Clear all previous competition session data from local storage
    clearCompetitionStorage();

    const res = await participantApi.register(details);
    if (res.token && res.user && setAuthSession) {
      setAuthSession(res.token, res.user);
    }
    return res;
  };

  const clearParticipant = () => {
    clearCompetitionStorage();
    if (logout) {
      logout();
    }
  };

  return (
    <ParticipantContext.Provider
      value={{
        participant,
        isRegistered: !!participant && !!participant.participantId,
        registerParticipant,
        clearParticipant,
      }}
    >
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipant() {
  const context = useContext(ParticipantContext);
  if (!context) {
    throw new Error('useParticipant must be used within a ParticipantProvider');
  }
  return context;
}
