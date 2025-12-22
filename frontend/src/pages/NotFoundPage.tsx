import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * Page 404 - Non trouvée
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <CardTitle className="text-2xl">Page non trouvée</CardTitle>
          <CardDescription className="text-lg">
            Désolé, la page que vous recherchez n'existe pas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Il se peut que cette page ait été déplacée, supprimée ou que l'URL soit incorrecte.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link to="/" className="w-full">
            <Button className="w-full" size="lg">
              <Home className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Page précédente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};


