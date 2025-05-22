import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { tasksApi } from '../api/api';

// Types
interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id: number;
  project_name: string;
  created_at: string;
  updated_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id: number;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'À faire',
    priority: 'Moyenne',
    project_id: 0
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<{id: number, name: string}[]>([]);

  // Colonnes pour le tableau de données
  const columns = [
    { key: 'title', header: 'Titre', sortable: true },
    { key: 'project_name', header: 'Projet', sortable: true },
    { key: 'status', header: 'Statut', sortable: true },
    { key: 'priority', header: 'Priorité', sortable: true },
    { 
      key: 'due_date', 
      header: 'Échéance', 
      sortable: true,
      render: (task: Task) => task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Non définie'
    },
    { key: 'actions', header: 'Actions' }
  ];

  // Charger les tâches
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        
        const data = await tasksApi.getAll(params);
        setTasks(data);
        setTotalItems(data.length); // Dans une API réelle, cela viendrait d'un header ou d'une métadonnée
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des tâches:', err);
        setError('Impossible de charger les tâches. Veuillez réessayer plus tard.');
        toast.error('Erreur lors du chargement des tâches');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentPage, itemsPerPage, searchQuery]);

  // Charger les projets pour le formulaire
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Normalement, on utiliserait projectsApi.getAll() ici
        // Pour l'exemple, on utilise des données statiques
        setProjects([
          { id: 1, name: 'Site web e-commerce' },
          { id: 2, name: 'Application mobile' },
          { id: 3, name: 'Refonte graphique' }
        ]);
      } catch (err) {
        console.error('Erreur lors du chargement des projets:', err);
        toast.error('Erreur lors du chargement des projets');
      }
    };

    fetchProjects();
  }, []);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddTask = () => {
    setCurrentTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'À faire',
      priority: 'Moyenne',
      project_id: projects.length > 0 ? projects[0].id : 0
    });
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : undefined,
      project_id: task.project_id
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setCurrentTask(task);
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
      
      if (currentTask) {
        // Mise à jour
        await tasksApi.update(currentTask.id, formData);
        
        // Mettre à jour l'état local
        setTasks(prev => 
          prev.map(t => t.id === currentTask.id 
            ? { 
                ...t, 
                ...formData,
                project_name: projects.find(p => p.id === parseInt(formData.project_id.toString()))?.name || t.project_name
              } 
            : t
          )
        );
        
        toast.success('Tâche mise à jour avec succès');
      } else {
        // Création
        const newTask = await tasksApi.create(formData);
        
        // Ajouter à l'état local
        setTasks(prev => [...prev, {
          ...newTask,
          project_name: projects.find(p => p.id === parseInt(formData.project_id.toString()))?.name || 'Projet inconnu'
        }]);
        
        toast.success('Tâche créée avec succès');
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      toast.error(currentTask 
        ? 'Erreur lors de la mise à jour de la tâche' 
        : 'Erreur lors de la création de la tâche'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!currentTask) return;
    
    try {
      setIsSubmitting(true);
      await tasksApi.delete(currentTask.id);
      
      // Mettre à jour l'état local
      setTasks(prev => prev.filter(t => t.id !== currentTask.id));
      
      setIsDeleteModalOpen(false);
      toast.success('Tâche supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = async (key: keyof Task, direction: 'asc' | 'desc') => {
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
      
      const data = await tasksApi.getAll(params);
      setTasks(data);
    } catch (err) {
      console.error('Erreur lors du tri:', err);
      toast.error('Erreur lors du tri des tâches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Tâches" 
        onAdd={handleAddTask} 
        onSearch={handleSearch} 
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement des tâches...</p>
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
              data={tasks}
              columns={columns}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
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

      {/* Modal pour ajouter/éditer une tâche */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={currentTask ? "Modifier la tâche" : "Ajouter une tâche"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Titre de la tâche *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
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
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                Projet *
              </label>
              <select
                name="project_id"
                id="project_id"
                required
                value={formData.project_id}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
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
                <option value="À faire">À faire</option>
                <option value="En cours">En cours</option>
                <option value="En attente">En attente</option>
                <option value="Terminée">Terminée</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priorité
              </label>
              <select
                name="priority"
                id="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="Basse">Basse</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Date d'échéance
              </label>
              <input
                type="date"
                name="due_date"
                id="due_date"
                value={formData.due_date || ''}
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
              ) : currentTask ? 'Mettre à jour' : 'Créer'}
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
          <p className="mb-4">Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.</p>
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

export default Tasks;
