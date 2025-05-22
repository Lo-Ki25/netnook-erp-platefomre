import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import { analyticsApi } from '../api/api';

// Importation des composants de graphiques
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';

// Types
interface AnalyticsData {
  projectStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    projectsByStatus: Array<{name: string, value: number}>;
    projectsOverTime: Array<{month: string, count: number}>;
  };
  clientStats: {
    totalClients: number;
    newClientsThisMonth: number;
    clientsWithProjects: number;
    topClients: Array<{name: string, projectCount: number, revenue: number}>;
  };
  financeStats: {
    totalRevenue: number;
    revenueThisMonth: number;
    outstandingInvoices: number;
    revenueByMonth: Array<{month: string, revenue: number}>;
    revenueByCategory: Array<{category: string, value: number}>;
  };
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    tasksByStatus: Array<{status: string, count: number}>;
    taskCompletionRate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Charger les données d'analyse
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsApi.getAnalytics({ timeRange });
        setAnalyticsData(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des analyses:', err);
        setError('Impossible de charger les analyses. Veuillez réessayer plus tard.');
        toast.error('Erreur lors du chargement des analyses');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Formatter les valeurs monétaires
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Formatter les pourcentages
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement des analyses...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Réessayer
            </button>
          </div>
        ) : analyticsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* KPI Cards */}
            <div className="bg-white rounded-lg shadow p-6 col-span-1">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Projets</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{analyticsData.projectStats.totalProjects}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.projectStats.activeProjects}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Terminés</p>
                  <p className="text-2xl font-bold text-purple-600">{analyticsData.projectStats.completedProjects}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Taux de complétion</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatPercent(analyticsData.projectStats.completedProjects / analyticsData.projectStats.totalProjects * 100)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 col-span-1">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Clients</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{analyticsData.clientStats.totalClients}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Nouveaux</p>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.clientStats.newClientsThisMonth}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Avec projets</p>
                  <p className="text-2xl font-bold text-purple-600">{analyticsData.clientStats.clientsWithProjects}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Taux d'activité</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatPercent(analyticsData.clientStats.clientsWithProjects / analyticsData.clientStats.totalClients * 100)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 col-span-1">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Finances</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Revenu total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(analyticsData.financeStats.totalRevenue)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Ce mois</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(analyticsData.financeStats.revenueThisMonth)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Factures impayées</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(analyticsData.financeStats.outstandingInvoices)}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Taux de recouvrement</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatPercent((analyticsData.financeStats.totalRevenue - analyticsData.financeStats.outstandingInvoices) / analyticsData.financeStats.totalRevenue * 100)}
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Revenus par mois</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData.financeStats.revenueByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenu" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 col-span-1">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Projets par statut</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.projectStats.projectsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.projectStats.projectsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Projets']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Tâches par statut</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.taskStats.tasksByStatus}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Nombre de tâches" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 col-span-1">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Revenus par catégorie</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.financeStats.revenueByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.financeStats.revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenu']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-3">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Top clients</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projets
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.clientStats.topClients.map((client, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{client.projectCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatCurrency(client.revenue)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Analytics;
