import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDatasets, fetchSources } from '@/features/data/dataSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, BarChart3, Building2, ArrowRight, Leaf, AlertTriangle, MapPinned, Clock, Waves } from 'lucide-react';
import { Loader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

/**
 * Page d'accueil
 */
export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { datasets, sources, loading, error } = useAppSelector((state) => state.data);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchDatasets());
      dispatch(fetchSources());
    }
  }, [dispatch, isAuthenticated]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899'];

  const parseDate = (s: string | null | undefined) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const truncateLabel = (s: string, max = 32) => {
    const str = (s || '').trim();
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
  };

  const daysSince = (d: Date) => {
    const ms = Date.now() - d.getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  };

  // Heuristique: repérer les jeux liés au Saint‑Laurent via mots-clés dans titre / org / ressources.
  const saintLaurentDatasets = useMemo(() => {
    const kw = [
      'saint laurent',
      'saint-laurent',
      'st laurent',
      'st. laurent',
      'st-lawrence',
      'saint-lawrence',
      'fleuve',
      'estuaire',
      'golfe',
      'gulf',
      'laurent',
    ];

    const hasKw = (txt: string) => {
      const t = (txt || '').toLowerCase();
      return kw.some((k) => t.includes(k));
    };

    return datasets.filter((ds) => {
      const blob = [
        ds.title,
        ds.organization?.title,
        ds.organization?.name,
        ds.source?.title,
        ...ds.resources.map((r) => `${r.name || ''} ${r.url || ''}`),
      ]
        .filter(Boolean)
        .join(' | ');

      return hasKw(blob);
    });
  }, [datasets]);

  // Si aucun dataset n'est détecté "Saint‑Laurent", on retombe sur tous les datasets
  // pour éviter un dashboard vide en démo.
  const scopedDatasets = saintLaurentDatasets.length > 0 ? saintLaurentDatasets : datasets;
  const scopeLabel = saintLaurentDatasets.length > 0 ? 'Saint‑Laurent' : 'Tous (fallback)';

  const totalResources = useMemo(
    () => scopedDatasets.reduce((sum, d) => sum + d.resources.length, 0),
    [scopedDatasets]
  );

  const geoResources = useMemo(() => {
    const GEO_FORMATS = new Set(['GEOJSON', 'SHP', 'GPKG', 'KML', 'KMZ', 'WMS', 'WFS']);
    let count = 0;
    for (const ds of scopedDatasets) {
      for (const r of ds.resources) {
        const fmt = (r.format || '').toUpperCase();
        const url = (r.url || '').toLowerCase();
        if (GEO_FORMATS.has(fmt) || url.includes('geojson') || url.includes('wms') || url.includes('wfs')) {
          count += 1;
        }
      }
    }
    return count;
  }, [scopedDatasets]);

  const freshness = useMemo(() => {
    const ages: number[] = [];
    for (const ds of scopedDatasets) {
      const d = parseDate(ds.metadata_modified) || parseDate(ds.metadata_created);
      if (!d) continue;
      ages.push(daysSince(d));
    }
    if (ages.length === 0) return { avgDays: null as number | null, stale180: 0 };
    const avgDays = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
    const stale180 = ages.filter((x) => x > 180).length;
    return { avgDays, stale180 };
  }, [scopedDatasets]);

  // Paramètres écologiques (inventés mais réalistes) via matching de mots-clés.
  const parameterStats = useMemo(() => {
    const buckets: Array<{ key: string; label: string; patterns: RegExp[] }> = [
      { key: 'water', label: 'Qualité de l’eau', patterns: [/water|eau|qualit/i, /ph\b/i, /turbid/i, /conduct/i, /dissolved|oxyg/i] },
      { key: 'temp', label: 'Température & glace', patterns: [/temp/i, /glace|ice/i, /gel|freeze/i] },
      { key: 'nutrients', label: 'Nutriments', patterns: [/nitrate|nitrite|phosph|ammon/i, /nutr/i] },
      { key: 'contam', label: 'Contaminants', patterns: [/mercure|lead|plomb|pcb|pestic|hydrocarb/i, /contamin/i] },
      { key: 'bio', label: 'Biodiversité', patterns: [/biodiv|species|esp[eè]ce|faune|flore|poisson|fish|bird/i] },
      { key: 'hydro', label: 'Hydrologie', patterns: [/d[ée]bit|flow|niveau|level|courant|current|mar[ée]e|tide/i] },
    ];

    const counts: Record<string, number> = Object.fromEntries(buckets.map((b) => [b.key, 0]));

    for (const ds of scopedDatasets) {
      const blob = [
        ds.title,
        ds.organization?.title,
        ds.organization?.name,
        ...ds.resources.map((r) => `${r.name || ''} ${r.url || ''} ${r.format || ''}`),
      ]
        .filter(Boolean)
        .join(' | ');

      const hit = buckets.find((b) => b.patterns.some((re) => re.test(blob)));
      if (hit) counts[hit.key] += 1;
    }

    const data = buckets
      .map((b) => ({ name: b.label, value: counts[b.key] }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

    const uniqueParams = data.length;
    return { data: data.length > 0 ? data : [{ name: 'Autres / non classés', value: scopedDatasets.length }], uniqueParams };
  }, [scopedDatasets]);

  const topOrganization = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ds of scopedDatasets) {
      const name = ds.organization?.title || ds.organization?.name || 'Sans organisation';
      map[name] = (map[name] || 0) + 1;
    }
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { name: '-', count: 0 };
    return { name: entries[0][0], count: entries[0][1] };
  }, [scopedDatasets]);

  const topOrganizationsData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ds of scopedDatasets) {
      const name = ds.organization?.title || ds.organization?.name || 'Sans organisation';
      map[name] = (map[name] || 0) + 1;
    }
    return Object.entries(map)
      .map(([organization, count]) => ({ organization, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [scopedDatasets]);

  const resourceFormatsData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ds of scopedDatasets) {
      for (const r of ds.resources) {
        const fmt = (r.format || 'AUTRE').toUpperCase().trim() || 'AUTRE';
        map[fmt] = (map[fmt] || 0) + 1;
      }
    }
    return Object.entries(map)
      .map(([format, count]) => ({ format, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [scopedDatasets]);

  const freshnessBuckets = useMemo(() => {
    const buckets = [
      { label: '0–30j', count: 0 },
      { label: '31–90j', count: 0 },
      { label: '91–180j', count: 0 },
      { label: '180j+', count: 0 },
    ];

    for (const ds of scopedDatasets) {
      const d = parseDate(ds.metadata_modified) || parseDate(ds.metadata_created);
      if (!d) continue;
      const age = daysSince(d);
      if (age <= 30) buckets[0].count += 1;
      else if (age <= 90) buckets[1].count += 1;
      else if (age <= 180) buckets[2].count += 1;
      else buckets[3].count += 1;
    }

    return buckets;
  }, [scopedDatasets]);

  const recentFive = useMemo(() => {
    return [...datasets]
      .sort((a, b) => {
        const da = new Date(a.metadata_modified || a.metadata_created || 0).getTime();
        const db = new Date(b.metadata_modified || b.metadata_created || 0).getTime();
        return db - da;
      })
      .slice(0, 5);
  }, [datasets]);

  const newByMonth = useMemo(() => {
    const monthCount: Record<string, number> = {};
    for (const ds of scopedDatasets) {
      const d = parseDate(ds.metadata_modified) || parseDate(ds.metadata_created);
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCount[key] = (monthCount[key] || 0) + 1;
    }
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const months: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(start.getFullYear(), start.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      months.push({ month: key, count: monthCount[key] || 0 });
    }
    return months;
  }, [scopedDatasets]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">OGSL - données du fleuve</CardTitle>
            <CardDescription className="text-lg">
              Catalogue moissonné (OpenGouv / CKAN) pour le suivi écologique du Saint-Laurent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Connecte-toi pour voir les jeux, les stats et lancer un moissonnage.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/login">
                <Button size="lg">Connexion</Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline">Inscription</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <Loader text="Chargement des données..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchDatasets())} />;
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Salut {user?.first_name || user?.username}</h1>
        <p className="text-lg text-muted-foreground">
          Tableau lié aux jeux moissonnés (thème fleuve / eau quand c’est détectable dans les métadonnées).
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jeux (total catalogue)</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasets.length}</div>
            <p className="text-xs text-muted-foreground">
              Jeux de données disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources.length}</div>
            <p className="text-xs text-muted-foreground">
              Sources de données
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ressources</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {datasets.reduce((sum, d) => sum + d.resources.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Fichiers de données
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Écologie Saint‑Laurent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Waves className="mr-2 h-5 w-5" />
            Tableau de bord - Écologie du Saint‑Laurent
          </CardTitle>
          <CardDescription>
            Indicateurs de suivi (basés sur les données moissonnées)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Jeux Saint‑Laurent</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {saintLaurentDatasets.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur {datasets.length} jeux au total
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Mesures (ressources)</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalResources}</div>
                <p className="text-xs text-muted-foreground">
                  Fichiers/URLs de données associés
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Couverture géospatiale</CardTitle>
                <MapPinned className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{geoResources}</div>
                <p className="text-xs text-muted-foreground">
                  Couches / services carto (WMS/WFS…)
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Fraîcheur moyenne</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {freshness.avgDays === null ? '-' : `${freshness.avgDays}j`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Depuis la dernière mise à jour
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Paramètres suivis</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parameterStats.uniqueParams}</div>
                <p className="text-xs text-muted-foreground">
                  Catégories (eau, nutriments, etc.)
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Alertes fraîcheur</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{freshness.stale180}</div>
                <p className="text-xs text-muted-foreground">
                  Jeux sans update depuis 180j+
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nouveaux jeux par mois (12 derniers mois)</CardTitle>
                <CardDescription>Évolution des ajouts/MAJ détectés</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={newByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" interval={0} angle={-45} textAnchor="end" height={90} minTickGap={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Jeux/mois" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition des paramètres (estimée)</CardTitle>
                <CardDescription>Classification par mots‑clés (métadonnées)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={parameterStats.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {parameterStats.data.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 3 graphiques additionnels (pour atteindre 5+) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top organismes contributeurs</CardTitle>
                <CardDescription>Jeux de données par organisation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topOrganizationsData} layout="vertical" margin={{ left: 12, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="organization"
                      width={170}
                      tickFormatter={(v) => truncateLabel(String(v), 22)}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Jeux" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top formats de ressources</CardTitle>
                <CardDescription>CSV, PDF, GeoJSON, WMS…</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={resourceFormatsData} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="format" interval={0} angle={-35} textAnchor="end" height={80} minTickGap={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Ressources" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fraîcheur des données</CardTitle>
                <CardDescription>Distribution des jeux selon l’âge (jours)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={freshnessBuckets} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Jeux" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Top organisme</span> : {topOrganization.name} ({topOrganization.count} jeu(x))
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Explorer les Datasets
            </CardTitle>
            <CardDescription>
              Parcourez et filtrez tous les jeux de données disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/datasets">
              <Button className="w-full">
                Voir les datasets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Statistiques & Graphiques
            </CardTitle>
            <CardDescription>
              Visualisez les données avec des graphiques interactifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/stats">
              <Button className="w-full">
                Voir les statistiques
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Datasets récents */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers jeux (aperçu)</CardTitle>
          <CardDescription>Tri rapide par date de mise à jour</CardDescription>
        </CardHeader>
        <CardContent>
          {datasets.length > 0 ? (
            <div className="space-y-4">
              {recentFive.map((dataset) => (
                <Link 
                  key={dataset.id} 
                  to={`/datasets/${dataset.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">{dataset.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataset.organization?.title || 'Organisation inconnue'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun dataset disponible
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


