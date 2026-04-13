import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDatasetsGraphQL } from '@/features/data/dataSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PdfExportButton } from '@/components/common/PdfExportButton';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Waves, Leaf, Database, MapPinned, Clock, AlertTriangle } from 'lucide-react';

/**
 * Statistiques et graphiques.
 */
export const StatsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { datasets, loading, error } = useAppSelector((state) => state.data);

  useEffect(() => {
    if (datasets.length === 0) {
      dispatch(fetchDatasetsGraphQL({ first: 100 }));
    }
  }, [dispatch, datasets.length]);

  const truncateLabel = (s: string, max = 34) => {
    const str = (s || '').trim();
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
  };

  const parseDate = (s: string | null | undefined) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const daysSince = (d: Date) => {
    const ms = Date.now() - d.getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  };

  // Même logique que le dashboard d'accueil: on tente de scope "Saint‑Laurent", sinon fallback à tous.
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

  const scopedDatasets = saintLaurentDatasets.length > 0 ? saintLaurentDatasets : datasets;

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

  // Données pour le graphique: Nouveaux jeux par mois (12 derniers mois)
  const dataByMonth = useMemo(() => {
    const monthCount: Record<string, number> = {};

    // Compter les "nouveaux jeux" par mois (on prend metadata_modified si dispo,
    // sinon metadata_created). Cela donne une courbe plus réaliste après moissonnage.
    scopedDatasets.forEach((dataset) => {
      const rawDate = dataset.metadata_modified || dataset.metadata_created;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCount[key] = (monthCount[key] || 0) + 1;
    });

    // Toujours afficher les 12 derniers mois, même si le compteur est à 0.
    const now = new Date();
    const months: { month: string; count: number }[] = [];
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(start.getFullYear(), start.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      months.push({ month: key, count: monthCount[key] || 0 });
    }
    return months;
  }, [scopedDatasets]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const orgChartHeight = Math.max(320, topOrganizationsData.length * 42);

  if (loading && datasets.length === 0) {
    return <Loader text="Chargement des statistiques..." />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques & Graphiques</CardTitle>
          <CardDescription>Impossible de charger les statistiques pour le moment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => dispatch(fetchDatasetsGraphQL({ first: 100 }))}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (datasets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques & Graphiques</CardTitle>
          <CardDescription>Aucune donnée disponible pour les statistiques.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Lance un moissonnage, puis reviens ici pour voir les graphiques.
          </p>
          <Button variant="outline" onClick={() => dispatch(fetchDatasetsGraphQL({ first: 100 }))}>
            Actualiser
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center">
            <BarChart3 className="mr-3 h-8 w-8" />
            Statistiques & Graphiques
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualisation des données du portail
          </p>
        </div>
        <PdfExportButton 
          elementId="stats-content"
          filename="statistiques-ogsl.pdf"
          title="Statistiques & Graphiques - OGSL Data Portal"
          buttonText="Exporter en PDF"
        />
      </div>

      {/* Conteneur pour l'export PDF */}
      <div id="stats-content" className="space-y-6 bg-background p-6">
        {/* Tableau de bord (mêmes stats que la page Accueil) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Waves className="mr-2 h-5 w-5" />
              Tableau de bord - Écologie du Saint‑Laurent
            </CardTitle>
            <CardDescription>Les mêmes indicateurs que sur la page d’accueil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Jeux Saint‑Laurent</CardTitle>
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{saintLaurentDatasets.length}</div>
                  <p className="text-xs text-muted-foreground">Sur {datasets.length} jeux au total</p>
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Mesures (ressources)</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalResources}</div>
                  <p className="text-xs text-muted-foreground">Fichiers/URLs de données associés</p>
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Couverture géospatiale</CardTitle>
                  <MapPinned className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{geoResources}</div>
                  <p className="text-xs text-muted-foreground">Couches / services carto (WMS/WFS…)</p>
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
                  <p className="text-xs text-muted-foreground">Depuis la dernière mise à jour</p>
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Paramètres suivis</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parameterStats.uniqueParams}</div>
                  <p className="text-xs text-muted-foreground">Catégories (eau, nutriments, etc.)</p>
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Alertes fraîcheur</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{freshness.stale180}</div>
                  <p className="text-xs text-muted-foreground">Jeux sans update depuis 180j+</p>
                </CardContent>
              </Card>
            </div>

            {/* 5 graphiques comme sur l'accueil */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nouveaux jeux par mois (12 derniers mois)</CardTitle>
                  <CardDescription>Évolution des ajouts/MAJ détectés</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={dataByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        minTickGap={0}
                        tickMargin={12}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Jeux/mois"
                      />
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
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={parameterStats.data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={115}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top organismes contributeurs</CardTitle>
                  <CardDescription>Jeux de données par organisation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={topOrganizationsData} layout="vertical" margin={{ left: 12, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="organization"
                        width={190}
                        tickFormatter={(v) => truncateLabel(String(v), 26)}
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
                  <ResponsiveContainer width="100%" height={340}>
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
                  <ResponsiveContainer width="100%" height={340}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


