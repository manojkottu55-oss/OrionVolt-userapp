import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';

const ProfileContext = createContext({
  profile: null,
  vehicles: [],
  profileCompleted: false,
  loading: true,
  refreshProfile: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setVehicles([]);
      setProfileCompleted(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get('/profile');
      if (data.success) {
        setProfile(data.profile);
        setVehicles(data.vehicles || []);
        setProfileCompleted(data.profile.profile_completed || false);
      }
    } catch (error) {
      console.error('[OrionVolt] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, vehicles, profileCompleted, loading, refreshProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
