import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutUser } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Database, 
  BarChart3, 
  Download,
  User, 
  LogOut, 
  LogIn 
} from 'lucide-react';

/**
 * Barre de navigation principale
 */
export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold hover:opacity-80 transition">
            <Database className="h-6 w-6" />
            <span>OGSL Data Portal</span>
          </Link>

          {/* Navigation principale */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Home className="mr-2 h-4 w-4" />
                  Accueil
                </Button>
              </Link>
              <Link to="/datasets">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Database className="mr-2 h-4 w-4" />
                  Datasets
                </Button>
              </Link>
              <Link to="/stats">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Statistiques
                </Button>
              </Link>
              <Link to="/harvest">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Download className="mr-2 h-4 w-4" />
                  Moissonnage
                </Button>
              </Link>
            </div>
          )}

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <User className="mr-2 h-4 w-4" />
                    {user?.username || 'Profil'}
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <LogIn className="mr-2 h-4 w-4" />
                    Connexion
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary">
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


