import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

// Configuration de base pour axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les requêtes
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // On pourrait ajouter ici un token d'authentification si nécessaire
    return config;
  },
  (error: AxiosError) => {
    console.error('Erreur lors de la requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);

// Fonction de gestion globale des erreurs
const handleApiError = (error: AxiosError) => {
  console.error('Erreur API:', error);
  
  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'erreur
    const status = error.response.status;
    const data = error.response.data as any;
    
    let message = 'Une erreur est survenue';
    
    if (data && data.detail) {
      message = data.detail;
    } else if (data && data.message) {
      message = data.message;
    }
    
    switch (status) {
      case 400:
        toast.error(`Erreur de requête: ${message}`);
        break;
      case 401:
        toast.error('Vous devez être connecté pour effectuer cette action');
        // Ici on pourrait rediriger vers la page de connexion
        break;
      case 403:
        toast.error('Vous n\'avez pas les permissions nécessaires');
        break;
      case 404:
        toast.error('Ressource non trouvée');
        break;
      case 422:
        // Erreurs de validation
        if (data.detail && Array.isArray(data.detail)) {
          data.detail.forEach((err: any) => {
            toast.error(`Validation: ${err.loc.join('.')} - ${err.msg}`);
          });
        } else {
          toast.error(`Erreur de validation: ${message}`);
        }
        break;
      case 500:
        toast.error('Erreur serveur. Veuillez réessayer plus tard.');
        break;
      default:
        toast.error(`Erreur (${status}): ${message}`);
    }
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    toast.error('Aucune réponse du serveur. Vérifiez votre connexion internet.');
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    toast.error(`Erreur: ${error.message}`);
  }
};

// Fonction utilitaire pour gérer les erreurs dans les composants
export const handleComponentError = (error: any, customMessage?: string) => {
  console.error('Erreur composant:', error);
  
  if (axios.isAxiosError(error)) {
    // L'intercepteur s'en occupera
    return;
  }
  
  // Pour les erreurs non-Axios
  toast.error(customMessage || 'Une erreur inattendue est survenue');
};

// API pour les projets
export const projectsApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: number) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await api.post('/projects', data);
      toast.success('Projet créé avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: number, data: any) => {
    try {
      const response = await api.put(`/projects/${id}`, data);
      toast.success('Projet mis à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: number) => {
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Projet supprimé avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour les clients
export const clientsApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/clients', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: number) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await api.post('/clients', data);
      toast.success('Client créé avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: number, data: any) => {
    try {
      const response = await api.put(`/clients/${id}`, data);
      toast.success('Client mis à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: number) => {
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client supprimé avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour les tâches
export const tasksApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: number) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await api.post('/tasks', data);
      toast.success('Tâche créée avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: number, data: any) => {
    try {
      const response = await api.put(`/tasks/${id}`, data);
      toast.success('Tâche mise à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Tâche supprimée avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour les finances
export const financeApi = {
  getAllInvoices: async (params?: any) => {
    try {
      const response = await api.get('/finance/invoices', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getInvoiceById: async (id: number) => {
    try {
      const response = await api.get(`/finance/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createInvoice: async (data: any) => {
    try {
      const response = await api.post('/finance/invoices', data);
      toast.success('Facture créée avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateInvoice: async (id: number, data: any) => {
    try {
      const response = await api.put(`/finance/invoices/${id}`, data);
      toast.success('Facture mise à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteInvoice: async (id: number) => {
    try {
      await api.delete(`/finance/invoices/${id}`);
      toast.success('Facture supprimée avec succès');
    } catch (error) {
      throw error;
    }
  },
  getAllTransactions: async (params?: any) => {
    try {
      const response = await api.get('/finance/transactions', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getTransactionById: async (id: number) => {
    try {
      const response = await api.get(`/finance/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createTransaction: async (data: any) => {
    try {
      const response = await api.post('/finance/transactions', data);
      toast.success('Transaction créée avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateTransaction: async (id: number, data: any) => {
    try {
      const response = await api.put(`/finance/transactions/${id}`, data);
      toast.success('Transaction mise à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteTransaction: async (id: number) => {
    try {
      await api.delete(`/finance/transactions/${id}`);
      toast.success('Transaction supprimée avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour le planning
export const planningApi = {
  getAllEvents: async (params?: any) => {
    try {
      const response = await api.get('/planning/events', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getEventById: async (id: number) => {
    try {
      const response = await api.get(`/planning/events/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createEvent: async (data: any) => {
    try {
      const response = await api.post('/planning/events', data);
      toast.success('Événement créé avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateEvent: async (id: number, data: any) => {
    try {
      const response = await api.put(`/planning/events/${id}`, data);
      toast.success('Événement mis à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteEvent: async (id: number) => {
    try {
      await api.delete(`/planning/events/${id}`);
      toast.success('Événement supprimé avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour les documents
export const documentsApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/documents', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: number) => {
    try {
      const response = await api.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  upload: async (formData: FormData) => {
    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document téléchargé avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: number, data: any) => {
    try {
      const response = await api.put(`/documents/${id}`, data);
      toast.success('Document mis à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: number) => {
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document supprimé avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour les ressources
export const resourcesApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/resources', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: number) => {
    try {
      const response = await api.get(`/resources/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await api.post('/resources', data);
      toast.success('Ressource créée avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: number, data: any) => {
    try {
      const response = await api.put(`/resources/${id}`, data);
      toast.success('Ressource mise à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: number) => {
    try {
      await api.delete(`/resources/${id}`);
      toast.success('Ressource supprimée avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour l'inventaire
export const inventoryApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/inventory', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: number) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await api.post('/inventory', data);
      toast.success('Article créé avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: number, data: any) => {
    try {
      const response = await api.put(`/inventory/${id}`, data);
      toast.success('Article mis à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: number) => {
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Article supprimé avec succès');
    } catch (error) {
      throw error;
    }
  }
};

// API pour les analyses
export const analyticsApi = {
  getAnalytics: async (params?: any) => {
    try {
      const response = await api.get('/analytics', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getProjectStats: async (params?: any) => {
    try {
      const response = await api.get('/analytics/projects', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getClientStats: async (params?: any) => {
    try {
      const response = await api.get('/analytics/clients', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getFinanceStats: async (params?: any) => {
    try {
      const response = await api.get('/analytics/finance', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getTaskStats: async (params?: any) => {
    try {
      const response = await api.get('/analytics/tasks', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// API pour les ressources humaines
export const hrApi = {
  getAllEmployees: async (params?: any) => {
    try {
      const response = await api.get('/hr/employees', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getEmployeeById: async (id: number) => {
    try {
      const response = await api.get(`/hr/employees/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createEmployee: async (data: any) => {
    try {
      const response = await api.post('/hr/employees', data);
      toast.success('Employé créé avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateEmployee: async (id: number, data: any) => {
    try {
      const response = await api.put(`/hr/employees/${id}`, data);
      toast.success('Employé mis à jour avec succès');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteEmployee: async (id: number) => {
    try {
      await api.delete(`/hr/employees/${id}`);
      toast.success('Employé supprimé avec succès');
    } catch (error) {
      throw error;
    }
  }
};

export default api;
