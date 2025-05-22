import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { resourcesApi } from '../api/api';

// Types
interface Resource {
  id: number;
  name: string;
  type: string;
  status: string;
  assigned_to?: number;
  assigned_to_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ResourceFormData {
  name: string;
  type: string;
  status: string;
  assigned_to?: number;
  notes?: string;
}

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    type: 'Matériel',
    status: 'Disponible'
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<{id: number, name: string}[]>([]);

  // Colonnes pour le tableau de données
  const columns = [
    { key: 'name', header: 'Nom', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'status', header: 'Statut', sortable: true },
    { 
      key: 'assigned_to_name', 
      header: 'Assigné à', 
      sortable: true,
      render: (resource: Resource) => resource.assigned_to_name || 'Non assigné'
    },
    { key: 'actions', header: 'Actions' }
  ];

  // Charger les ressources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        
        const data = await resourcesApi.getAll(params);
        setResources(data);
        setTotalItems(data.length); // Dans une API réelle, cela viendrait d'un header ou d'une métadonnée
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des ressources:', err);
        setError('Impossible de charger les ressources. Veuillez réessayer plus tard.');
        toast.error('Erreur lors du chargement des ressources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [currentPage, itemsPerPage, searchQuery]);

  // Charger les employés pour le formulaire
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Normalement, on utiliserait hrApi.getAllEmployees() ici
        // Pour l'exemple, on utilise des données statiques
        setEmployees([
          { id: 1, name: 'Jean Dupont' },
          { id: 2, name: 'Marie Martin' },
          { id: 3, name: 'Pierre Durand' }
        ]);
      } catch (err) {
        console.error('Erreur lors du chargement des employés:', err);
        toast.error('Erreur lors du chargement des employés');
      }
    };

    fetchEmployees();
  }, []);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddResource = () => {
    setCurrentResource(null);
    setFormData({
      name: '',
      type: 'Matériel',
      status: 'Disponible',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEditResource = (resource: Resource) => {
    setCurrentResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      status: resource.status,
      assigned_to: resource.assigned_to,
      notes: resource.notes
    });
    setIsModalOpen(true);
  };

  const handleDeleteResource = (resource: Resource) => {
    setCurrentResource(resource);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assigned_to' ? (value ? Number(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (currentResource) {
        // Mise à jour
        await resourcesApi.update(currentResource.id, formData);
        
        // Mettre à jour l'état local
        setResources(prev => 
          prev.map(r => r.id === currentResource.id 
            ? { 
                ...r, 
                ...formData,
                assigned_to_name: formData.assigned_to 
                  ? employees.find(e => e.id === formData.assigned_to)?.name || r.assigned_to_name
                  : undefined
              } 
            : r
          )
        );
        
        toast.success('Ressource mise à jour avec succès');
      } else {
        // Création
        const newResource = await resourcesApi.create(formData);
        
        // Ajouter à l'état local
        setResources(prev => [...prev, {
          ...newResource,
          assigned_to_name: formData.assigned_to 
            ? employees.find(e => e.id === formData.assigned_to)?.name 
            : undefined
        }]);
        
        toast.success('Ressource créée avec succès');
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      toast.error(currentResource 
        ? 'Erreur lors de la mise à jour de la ressource' 
        : 'Erreur lors de la création de la ressource'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!currentResource) return;
    
    try {
      setIsSubmitting(true);
      await resourcesApi.delete(currentResource.id);
      
      // Mettre à jour l'état local
      setResources(prev => prev.filter(r => r.id !== currentResource.id));
      
      setIsDeleteModalOpen(false);
      toast.success('Ressource supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression de la ressource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = async (key: keyof Resource, direction: 'asc' | 'desc') => {
    try {
      setLoading(true);
      
      // Dans une API réelle, on passerait ces paramètres à l'API
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        sort_by: key,
        sort_direction: direction
      };
      
      const data = await resourcesApi.getAll(params);
      setResources(data);
    } catch (err) {
      console.error('Erreur lors du tri:', err);
      toast.error('Erreur lors du tri des ressources');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Ressources" 
        onAdd={handleAddResource} 
        onSearch={handleSearch} 
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement des ressources...</p>
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
        ) : (
          <>
            <DataTable 
              data={resources}
              columns={columns}
              onEdit={handleEditResource}
              onDelete={handleDeleteResource}
              onSort={handleSort}
            />
            
            <div className="mt-4">
              <Pagination 
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal pour ajouter/éditer une ressource */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={currentResource ? "Modifier la ressource" : "Ajouter une ressource"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom de la ressource *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="Matériel">Matériel</option>
                <option value="Logiciel">Logiciel</option>
                <option value="Véhicule">Véhicule</option>
                <option value="Salle">Salle</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="Disponible">Disponible</option>
                <option value="En utilisation">En utilisation</option>
                <option value="En maintenance">En maintenance</option>
                <option value="Indisponible">Indisponible</option>
              </select>
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                Assigné à
              </label>
              <select
                name="assigned_to"
                id="assigned_to"
                value={formData.assigned_to || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Non assigné</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={3}
                value={formData.notes || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement...
                </span>
              ) : currentResource ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="p-4">
          <p className="mb-4">Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Suppression...
                </span>
              ) : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Resources;
