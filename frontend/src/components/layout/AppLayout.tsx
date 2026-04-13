import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

/**
 * Layout principal de l'application
 */
export const AppLayout: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-muted py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {year} Projet INF37407 - données ouvertes (OpenGouv) liées au suivi du fleuve</p>
          <p className="mt-1">React / Redux, API Django du TP1</p>
        </div>
      </footer>
    </div>
  );
};


