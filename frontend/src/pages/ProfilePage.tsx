import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchUserProfile, updateUserProfile } from '@/features/auth/authSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Calendar, Shield, Edit2, Save, X } from 'lucide-react';
import { Loader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDateTime } from '@/utils/format';

/**
 * Profil utilisateur.
 */
export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(fetchUserProfile());
    } else {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  }, [dispatch, user]);

  const handleEdit = () => {
    setIsEditing(true);
    setUpdateSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  };

  const handleSave = async () => {
    await dispatch(updateUserProfile(formData));
    setIsEditing(false);
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return <Loader text="Chargement du profil..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchUserProfile())} />;
  }

  if (!user) {
    return <ErrorState message="Utilisateur non trouvé" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Mon Profil</h1>
        <p className="text-muted-foreground">
          Informations de votre compte
        </p>
      </div>

      {updateSuccess && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-700 font-medium text-center">
              ✅ Profil mis à jour avec succès !
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Détails de votre compte utilisateur
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline">
                <Edit2 className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Nom d'utilisateur
              </label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-medium">{user.username}</p>
              </div>
              <p className="text-xs text-muted-foreground">Non modifiable</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              {isEditing ? (
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre.email@exemple.com"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-medium">{user.email || 'Non renseigné'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Prénom
              </label>
              {isEditing ? (
                <Input
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                />
              ) : (
                <p className="text-lg font-medium">{user.first_name || 'Non renseigné'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Nom
              </label>
              {isEditing ? (
                <Input
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                />
              ) : (
                <p className="text-lg font-medium">{user.last_name || 'Non renseigné'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                ID Utilisateur
              </label>
              <Badge variant="outline">#{user.id}</Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Statut
              </label>
              <Badge variant="default">Compte actif</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Activité
          </CardTitle>
          <CardDescription>
            Informations sur votre utilisation du portail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Membre depuis</span>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(new Date().toISOString())}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Dernière connexion</span>
              <span className="text-sm text-muted-foreground">
                Aujourd'hui
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


