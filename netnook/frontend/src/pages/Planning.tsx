import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { planningApi } from '../api/api';

// Types
interface Event {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  all_day: boolean;
  location?: string;
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  all_day: boolean;
  location?: string;
}

const Planning: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    all_day: false,
    location: ''
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Colonnes pour le tableau de données
  const columns = [
    { key: 'title', header: 'Titre', sortable: true },
    { 
      key: 'start_date', 
      header: 'Date de début', 
      sortable: true,
      render: (event: Event) => {
        const date = new Date(event.start_date);
        return event.all_day 
          ? date.toLocaleDateString() 
          : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      }
    },
    { 
      key: 'end_date', 
      header: 'Date de fin', 
      sortable: true,
      render: (event: Event) => {
        if (!event.end_date) return '-';
        const date = new Date(event.end_date);
        return event.all_day 
          ? date.toLocaleDateString() 
          : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      }
    },
    { 
      key: 'all_day', 
      header: 'Journée entière', 
      sortable: true,
      render: (event: Event) => event.all_day ? 'Oui' : 'Non'
    },
    { key: 'location', header: 'Lieu', sortable: true },
    { key: 'actions', header: 'Actions' }
  ];

  // Charger les événements
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        
        const data = await planningApi.getAllEvents(params);
        setEvents(data);
        setTotalItems(data.length); // Dans une API réelle, cela viendrait d'un header ou d'une métadonnée
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setError('Impossible de charger les événements. Veuillez réessayer plus tard.');
        toast.error('Erreur lors du chargement des événements');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentPage, itemsPerPage, searchQuery]);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddEvent = () => {
    setCurrentEvent(null);
    setFormData({
      title: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      all_day: false,
      location: ''
    });
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      start_date: event.start_date.includes('T') 
        ? event.start_date.split('T')[0] 
        : event.start_date,
      end_date: event.end_date 
        ? (event.end_date.includes('T') ? event.end_date.split('T')[0] : event.end_date)
        : undefined,
      all_day: event.all_day,
      location: event.location
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setCurrentEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (currentEvent) {
        // Mise à jour
        await planningApi.updateEvent(currentEvent.id, formData);
        
        // Mettre à jour l'état local
        setEvents(prev => 
          prev.map(e => e.id === currentEvent.id 
            ? { ...e, ...formData } 
            : e
          )
        );
        
        toast.success('Événement mis à jour avec succès');
      } else {
        // Création
        const newEvent = await planningApi.createEvent(formData);
        
        // Ajouter à l'état local
        setEvents(prev => [...prev, newEvent]);
        
        toast.success('Événement créé avec succès');
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      toast.error(currentEvent 
        ? 'Erreur lors de la mise à jour de l\'événement' 
        : 'Erreur lors de la création de l\'événement'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!currentEvent) return;
    
    try {
      setIsSubmitting(true);
      await planningApi.deleteEvent(currentEvent.id);
      
      // Mettre à jour l'état local
      setEvents(prev => prev.filter(e => e.id !== currentEvent.id));
      
      setIsDeleteModalOpen(false);
      toast.success('Événement supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = async (key: keyof Event, direction: 'asc' | 'desc') => {
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
      
      const data = await planningApi.getAllEvents(params);
      setEvents(data);
    } catch (err) {
      console.error('Erreur lors du tri:', err);
      toast.error('Erreur lors du tri des événements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Planning" 
        onAdd={handleAddEvent} 
        onSearch={handleSearch} 
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement des événements...</p>
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
              data={events}
              columns={columns}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
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

      {/* Modal pour ajouter/éditer un événement */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={currentEvent ? "Modifier l'événement" : "Ajouter un événement"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Titre de l'événement *
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
                value={formData.description || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="all_day"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="all_day" className="ml-2 block text-sm text-gray-700">
                  Journée entière
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Date de début *
              </label>
              <input
                type={formData.all_day ? "date" : "datetime-local"}
                name="start_date"
                id="start_date"
                required
                value={formData.start_date}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Date de fin
              </label>
              <input
                type={formData.all_day ? "date" : "datetime-local"}
                name="end_date"
                id="end_date"
                value={formData.end_date || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Lieu
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.location || ''}
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
              ) : currentEvent ? 'Mettre à jour' : 'Créer'}
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
          <p className="mb-4">Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.</p>
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

export default Planning;
