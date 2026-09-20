import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, EventItem } from '../types';
import * as api from '../services/api';

interface AppContextType {
  user: User;
  switchRole: (role: UserRole) => void;
  events: EventItem[];
  refreshEvents: () => Promise<void>;
  notification: string | null;
  showNotification: (msg: string) => void;
  clearNotification: () => void;
  unlockedGalleries: Record<string, boolean>; // galleryId -> boolean (PIN unlocked in current session)
  unlockGallery: (galleryId: string) => void;
}

const DEFAULT_USERS: Record<UserRole, User> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Julian Thorne',
    email: 'j.thorne@lumen-archive.ch',
    role: 'admin'
  },
  team_member: {
    id: 'usr-team-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@phototeam.com',
    role: 'team_member'
  },
  customer: {
    id: 'usr-customer-1',
    name: 'Private Collector',
    email: 'collector@private.com',
    role: 'customer'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [unlockedGalleries, setUnlockedGalleries] = useState<Record<string, boolean>>({
    'solarium-archive': true // pre-unlocked for quick previewing
  });

  const refreshEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load events:', e);
    }
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const clearNotification = () => setNotification(null);

  const unlockGallery = (galleryId: string) => {
    setUnlockedGalleries((prev) => ({ ...prev, [galleryId]: true }));
  };

  return (
    <AppContext.Provider
      value={{
        user: DEFAULT_USERS[currentRole],
        switchRole,
        events,
        refreshEvents,
        notification,
        showNotification,
        clearNotification,
        unlockedGalleries,
        unlockGallery
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
