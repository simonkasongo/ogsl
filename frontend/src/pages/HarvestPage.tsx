import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, CheckCircle, XCircle, Database } from 'lucide-react';
import axiosClient from '@/api/axiosClient';

export const HarvestPage: React.FC = () => {
  const [count, setCount] = useState<number>(5);
  const [keywords, setKeywords] = useState<string>('');
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const keywordPresets: Array<{ label: string; query: string }> = [
    { label: "estuaire", query: "estuaire" },
    { label: "golfe", query: "golfe" },
    { label: "qualité de l'eau", query: "eau" },
    { label: "pollution", query: "pollution" },
    { label: "contaminants", query: "contaminants" },
    { label: "nutriments", query: "nutriments" },
    { label: "température", query: "temperature" },
    { label: "salinité", query: "salinity" },
    { label: "biodiversité", query: "biodiversite" },
    { label: "poissons", query: "poisson" },
    { label: "phoques", query: "phoque" },
    { label: "crabe des neiges", query: "crabe" },
    { label: "homard", query: "homard" },
  ];

  const handleThemeToggle = (label: string) => {
    const newSelected = new Set(selectedThemes);
    if (newSelected.has(label)) {
      newSelected.delete(label);
    } else {
      newSelected.add(label);
    }
    setSelectedThemes(newSelected);

    const selectedQueries = keywordPresets
      .filter(preset => newSelected.has(preset.label))
      .map(preset => preset.query);
    
    const combinedKeywords = selectedQueries.length > 0
      ? selectedQueries.join(', ')
      : '';
    
    setKeywords(combinedKeywords);
  };

  const handleHarvest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await axiosClient.post('/harvest/', {
        source: 'opengouv',
        count: count,
        keywords: keywords,
      });

      setResult({
        success: true,
        message:
          (response.data?.message || 'Moissonnage terminé avec succès') +
          (typeof response.data?.created === 'number' ? ` — ${response.data.created} dataset(s) ajouté(s)` : '')
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Erreur lors du moissonnage'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
          <Download className="mr-3 h-8 w-8" />
          Moissonnage de Données
        </h1>
        <p className="text-muted-foreground">
          Importez des datasets depuis les catalogues CKAN
        </p>
      </div>

      {result && (
        <Card className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              {result.success ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <p className={result.success ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                {result.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration du moissonnage</CardTitle>
          <CardDescription>
            Importez des datasets depuis OpenGouv Canada (filtrés sur « Saint‑Laurent »)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Source de données</label>
            <Card className="border-primary border-2 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">🇨🇦</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">OpenGouv Canada</h3>
                    <p className="text-xs text-muted-foreground">
                      Données ouvertes du gouvernement du Canada (CKAN)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <label htmlFor="count" className="text-sm font-medium">
              Nombre de datasets à moissonner
            </label>
            <Input
              id="count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Recommandé: 5-20 datasets par moissonnage
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="keywords" className="text-sm font-medium">
              Mots-clés additionnels (optionnel)
            </label>
            <Input
              id="keywords"
              type="text"
              placeholder="Ex: qualité de l'eau, nutriments, contaminants"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Séparez par des virgules. Le filtre « Saint‑Laurent » est toujours appliqué.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Thématiques écologiques (Saint‑Laurent)</label>
            <p className="text-xs text-muted-foreground">
              Cliquez sur plusieurs thématiques pour les ajouter. Cliquez à nouveau pour les retirer.
            </p>
            <div className="flex flex-wrap gap-2">
              {keywordPresets.map((k) => {
                const isSelected = selectedThemes.has(k.label);
                return (
                  <Badge
                    key={k.label}
                    variant={isSelected ? "default" : "secondary"}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }`}
                    onClick={() => handleThemeToggle(k.label)}
                  >
                    {k.label}
                  </Badge>
                );
              })}
            </div>
            {selectedThemes.size > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedThemes.size} thématique(s) sélectionnée(s)
              </p>
            )}
          </div>

          <Button
            onClick={handleHarvest}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Moissonnage en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Lancer le moissonnage
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>Source CKAN supportée:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>OpenGouv: Données ouvertes du gouvernement du Canada</li>
            </ul>
            <p className="pt-3">
              <strong>Note:</strong> Le moissonnage peut prendre plusieurs minutes selon le nombre de datasets sélectionnés.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

