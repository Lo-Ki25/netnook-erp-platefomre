import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { projectsApi } from '../api/api';

// Types
interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date?: string;
  budget: number;
  client_id?: number;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date?: string;
  budget: number;
  client_id?: number;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'En cours',
    start_date: new Date().toISOString().split('T')[0],
    budget: 0
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Colonnes pour le tableau de données
  const columns = [
    { key: 'name', header: 'Nom', sortable: true },
    { key: 'status', header: 'Statut', sortable: true },
    { 
      key: 'client_name', 
      header: 'Client', 
      sortable: true,
      render: (project: Project) => project.client_name || 'Non assigné'
    },
    { 
      key: 'start_date', 
      header: 'Date de début', 
      sortable: true,
      render: (project: Project) => new Date(project.start_date).toLocaleDateString()
    },
    { 
      key: 'budget', 
      header: 'Budget', 
      sortable: true,
      render: (project: Project) => `${project.budget.toLocaleString()} €`
    },
    { key: 'actions', header: 'Actions' }
  ];

  // Charger les projets
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        
        const data = await projectsApi.getAll(params);
        setProjects(data);
        setTotalItems(data.length); // Dans une API réelle, cela viendrait d'un header ou d'une métadonnée
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des projets:', err);
        setError('Impossible de charger les projets. Veuillez réessayer plus tard.');
        toast.error('Erreur lors du chargement des projets');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentPage, itemsPerPage, searchQuery]);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddProject = () => {
    setCurrentProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'En cours',
      start_date: new Date().toISOString().split('T')[0],
      budget: 0
    });
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date.split('T')[0],
      end_date: project.end_date ? project.end_date.split('T')[0] : undefined,
      budget: project.budget,
      client_id: project.client_id
    });
    setIsModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setCurrentProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (currentProject) {
        // Mise à jour
        await projectsApi.update(currentProject.id, formData);
        
        // Mettre à jour l'état local
        setProjects(prev => 
          prev.map(p => p.id === currentProject.id 
            ? { ...p, ...formData } 
            : p
          )
        );
        
        toast.success('Projet mis à jour avec succès');
      } else {
        // Création
        const newProject = await projectsApi.create(formData);
        
        // Ajouter à l'état local
        setProjects(prev => [...prev, newProject]);
        
        toast.success('Projet créé avec succès');
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      toast.error(currentProject 
        ? 'Erreur lors de la mise à jour du projet' 
        : 'Erreur lors de la création du projet'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!currentProject) return;
    
    try {
      setIsSubmitting(true);
      await projectsApi.delete(currentProject.id);
      
      // Mettre à jour l'état local
      setProjects(prev => prev.filter(p => p.id !== currentProject.id));
      
      setIsDeleteModalOpen(false);
      toast.success('Projet supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression du projet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = async (key: keyof Project, direction: 'asc' | 'desc') => {
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
      
      const data = await projectsApi.getAll(params);
      setProjects(data);
    } catch (err) {
      console.error('Erreur lors du tri:', err);
      toast.error('Erreur lors du tri des projets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Projets" 
        onAdd={handleAddProject} 
        onSearch={handleSearch} 
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement des projets...</p>
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
              data={projects}
              columns={columns}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
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

      {/* Modal pour ajouter/éditer un projet */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={currentProject ? "Modifier le projet" : "Ajouter un projet"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom du projet *
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

            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
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
                <option value="En cours">En cours</option>
                <option value="Planifié">Planifié</option>
                <option value="Terminé">Terminé</option>
                <option value="En pause">En pause</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                Budget (€)
              </label>
              <input
                type="number"
                name="budget"
                id="budget"
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Date de début
              </label>
              <input
                type="date"
                name="start_date"
                id="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Date de fin (optionnelle)
              </label>
              <input
                type="date"
                name="end_date"
                id="end_date"
                value={formData.end_date || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Ici, on pourrait ajouter un sélecteur de client */}
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
              ) : currentProject ? 'Mettre à jour' : 'Créer'}
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
          <p className="mb-4">Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.</p>
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

export default Projects;
