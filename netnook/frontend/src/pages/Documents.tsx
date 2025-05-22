import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { documentsApi } from '../api/api';

// Types
interface Document {
  id: number;
  name: string;
  file_path: string;
  file_type: string;
  size: number;
  project_id?: number;
  project_name?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentFormData {
  name: string;
  project_id?: number;
  file?: File;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>({
    name: '',
    project_id: undefined
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<{id: number, name: string}[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Colonnes pour le tableau de données
  const columns = [
    { key: 'name', header: 'Nom', sortable: true },
    { key: 'project_name', header: 'Projet', sortable: true },
    { 
      key: 'file_type', 
      header: 'Type', 
      sortable: true,
      render: (document: Document) => {
        const typeMap: {[key: string]: string} = {
          'application/pdf': 'PDF',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
          'image/jpeg': 'Image JPEG',
          'image/png': 'Image PNG',
          'application/octet-stream': 'Fichier binaire'
        };
        return typeMap[document.file_type] || document.file_type;
      }
    },
    { 
      key: 'size', 
      header: 'Taille', 
      sortable: true,
      render: (document: Document) => {
        if (document.size < 1024) {
          return `${document.size} o`;
        } else if (document.size < 1024 * 1024) {
          return `${(document.size / 1024).toFixed(2)} Ko`;
        } else {
          return `${(document.size / (1024 * 1024)).toFixed(2)} Mo`;
        }
      }
    },
    { 
      key: 'created_at', 
      header: 'Date d\'ajout', 
      sortable: true,
      render: (document: Document) => new Date(document.created_at).toLocaleString()
    },
    { key: 'actions', header: 'Actions' }
  ];

  // Charger les documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        
        const data = await documentsApi.getAll(params);
        setDocuments(data);
        setTotalItems(data.length); // Dans une API réelle, cela viendrait d'un header ou d'une métadonnée
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des documents:', err);
        setError('Impossible de charger les documents. Veuillez réessayer plus tard.');
        toast.error('Erreur lors du chargement des documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
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

  const handleAddDocument = () => {
    setIsUploadModalOpen(true);
    setSelectedFile(null);
    setFormData({
      name: '',
      project_id: projects.length > 0 ? projects[0].id : undefined
    });
  };

  const handleEditDocument = (document: Document) => {
    setCurrentDocument(document);
    setFormData({
      name: document.name,
      project_id: document.project_id
    });
    setIsModalOpen(true);
  };

  const handleDeleteDocument = (document: Document) => {
    setCurrentDocument(document);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'project_id' ? (value ? Number(value) : undefined) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Auto-fill name if empty
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: file.name
        }));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('name', formData.name);
      if (formData.project_id) {
        formDataToSend.append('project_id', formData.project_id.toString());
      }
      
      const newDocument = await documentsApi.upload(formDataToSend);
      
      // Ajouter à l'état local
      setDocuments(prev => [...prev, {
        ...newDocument,
        project_name: formData.project_id 
          ? projects.find(p => p.id === formData.project_id)?.name || 'Projet inconnu'
          : undefined
      }]);
      
      setIsUploadModalOpen(false);
      toast.success('Document téléchargé avec succès');
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      toast.error('Erreur lors du téléchargement du document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentDocument) return;
    
    try {
      setIsSubmitting(true);
      
      await documentsApi.update(currentDocument.id, formData);
      
      // Mettre à jour l'état local
      setDocuments(prev => 
        prev.map(d => d.id === currentDocument.id 
          ? { 
              ...d, 
              ...formData,
              project_name: formData.project_id 
                ? projects.find(p => p.id === formData.project_id)?.name || d.project_name
                : undefined
            } 
          : d
        )
      );
      
      setIsModalOpen(false);
      toast.success('Document mis à jour avec succès');
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      toast.error('Erreur lors de la mise à jour du document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!currentDocument) return;
    
    try {
      setIsSubmitting(true);
      await documentsApi.delete(currentDocument.id);
      
      // Mettre à jour l'état local
      setDocuments(prev => prev.filter(d => d.id !== currentDocument.id));
      
      setIsDeleteModalOpen(false);
      toast.success('Document supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression du document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = async (key: keyof Document, direction: 'asc' | 'desc') => {
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
      
      const data = await documentsApi.getAll(params);
      setDocuments(data);
    } catch (err) {
      console.error('Erreur lors du tri:', err);
      toast.error('Erreur lors du tri des documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Documents" 
        onAdd={handleAddDocument} 
        onSearch={handleSearch} 
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement des documents...</p>
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
              data={documents}
              columns={columns}
              onEdit={handleEditDocument}
              onDelete={handleDeleteDocument}
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

      {/* Modal pour télécharger un document */}
      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => !isSubmitting && setIsUploadModalOpen(false)}
        title="Télécharger un document"
        size="lg"
      >
        <form onSubmit={handleUploadSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                Fichier *
              </label>
              <input
                type="file"
                name="file"
                id="file"
                required
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom du document *
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
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                Projet associé
              </label>
              <select
                name="project_id"
                id="project_id"
                value={formData.project_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Aucun projet</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
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
                  Téléchargement...
                </span>
              ) : 'Télécharger'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal pour éditer les informations d'un document */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Modifier les informations du document"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom du document *
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
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                Projet associé
              </label>
              <select
                name="project_id"
                id="project_id"
                value={formData.project_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Aucun projet</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
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
              ) : 'Mettre à jour'}
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
          <p className="mb-4">Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.</p>
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

export default Documents;
