import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { registerUser, clearError } from '@/features/auth/authSlice';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';

/**
 * Page d'inscription
 */
export const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    // Validation
    if (formData.password !== formData.password2) {
      setValidationError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!formData.username || !formData.email || !formData.password) {
      setValidationError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    await dispatch(registerUser(formData));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const displayError = validationError || error;

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center flex items-center justify-center">
            <UserPlus className="mr-2 h-6 w-6" />
            Inscription
          </CardTitle>
          <CardDescription className="text-center">
            Créez votre compte pour accéder au portail
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {displayError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
                {displayError}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Nom d'utilisateur *
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choisissez un nom d'utilisateur"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium">
                  Prénom
                </label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Prénom"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="last_name" className="text-sm font-medium">
                  Nom
                </label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Nom"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe *
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password2" className="text-sm font-medium">
                Confirmer le mot de passe *
              </label>
              <Input
                id="password2"
                name="password2"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={formData.password2}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire'
              )}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};


