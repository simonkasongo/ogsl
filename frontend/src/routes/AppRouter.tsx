import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { DataListPage } from '@/pages/DataListPage';
import { DataDetailsPage } from '@/pages/DataDetailsPage';
import { StatsPage } from '@/pages/StatsPage';
import { HarvestPage } from '@/pages/HarvestPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          <Route 
            path="profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="datasets" 
            element={
              <ProtectedRoute>
                <DataListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="datasets/:id" 
            element={
              <ProtectedRoute>
                <DataDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="stats" 
            element={
              <ProtectedRoute>
                <StatsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="harvest" 
            element={
              <ProtectedRoute>
                <HarvestPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};


