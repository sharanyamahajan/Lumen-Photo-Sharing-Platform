/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ScreenNavigator } from './components/ScreenNavigator';

import { SignInScreen } from './screens/SignInScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { EventDetailAdminScreen } from './screens/EventDetailAdminScreen';
import { TeamDashboardScreen } from './screens/TeamDashboardScreen';
import { TeamUploadScreen } from './screens/TeamUploadScreen';
import { GalleryPinScreen } from './screens/GalleryPinScreen';
import { PublicGalleryScreen } from './screens/PublicGalleryScreen';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#f9f9f9] text-[#1a1c1c] selection:bg-black selection:text-white">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Default root goes to Admin Dashboard */}
              <Route path="/" element={<Navigate to="/admin" replace />} />

              {/* Screen 1: Sign In */}
              <Route path="/signin" element={<SignInScreen />} />

              {/* Screen 2: Admin Dashboard */}
              <Route path="/admin" element={<AdminDashboardScreen />} />

              {/* Screen 3: Event Detail (Admin view) */}
              <Route path="/admin/events/:eventId" element={<EventDetailAdminScreen />} />

              {/* Screen 4: Team Member Dashboard */}
              <Route path="/team" element={<TeamDashboardScreen />} />

              {/* Screen 5: Team Member Upload */}
              <Route path="/team/events/:eventId/upload" element={<TeamUploadScreen />} />

              {/* Screen 6: Gallery PIN Entry */}
              <Route path="/access/:galleryId" element={<GalleryPinScreen />} />
              <Route path="/access" element={<Navigate to="/access/solarium-archive" replace />} />

              {/* Screen 7: Public Gallery View */}
              <Route path="/gallery/:galleryId" element={<PublicGalleryScreen />} />
              <Route path="/gallery" element={<Navigate to="/gallery/solarium-archive" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </main>
          <Footer />
          <ScreenNavigator />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

