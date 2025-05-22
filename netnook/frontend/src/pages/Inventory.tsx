import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { inventoryApi } from '../api/api';

// Types
interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  supplier?: string;
  location?: string;
  reorder_level?: number;
  created_at: string;
  updated_at: string;
}

interface InventoryFormData {
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  supplier?: string;
  location?: string;
  reorder_level?: number;
}

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    category: 'Fournitures',
    quantity: 0,
    unit_price: 0
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Colonnes pour le tableau de données
  const columns = [
    { key: 'name', header: 'Nom', sortable: true },
    { key: 'category', header: 'Catégorie', sortable: true },
    { 
      key: 'quantity', 
      header: 'Quantité', 
      sortable: true,
      render: (item: InventoryItem) => item.quantity.toString()
    },
    { 
      key: 'unit_price', 
      header: 'Prix unitaire', 
      sortable: true,
      render: (item: InventoryItem) => `${item.unit_price.toLocaleString()} €`
    },
    { 
      key: 'total_value', 
      header: 'Valeur totale', 
      sortable: false,
      render: (item: InventoryItem) => `${(item.quantity * item.unit_price).toLocaleString()} €`
    },
    { key: 'supplier', header: 'Fournisseur', sortable: true },
    { key: 'location', header: 'Emplacement', sortable: true },
    { key: 'actions', header: 'Actions' }
  ];

  // Charger les articles d'inventaire
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        
        const data = await inventoryApi.getAll(params);
        setItems(data);
        setTotalItems(data.length); // Dans une API réelle, cela viendrait d'un header ou d'une métadonnée
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'inventaire:', err);
        setError('Impossible de charger l\'inventaire. Veuillez réessayer plus tard.');
        toast.error('Erreur lors du chargement de l\'inventaire');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [currentPage, itemsPerPage, searchQuery]);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setFormData({
      name: '',
      category: 'Fournitures',
      quantity: 0,
      unit_price: 0
    });
    setIsModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      supplier: item.supplier,
      location: item.location,
      reorder_level: item.reorder_level
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (currentItem) {
        // Mise à jour
        await inventoryApi.update(currentItem.id, formData);
        
        // Mettre à jour l'état local
        setItems(prev => 
          prev.map(i => i.id === currentItem.id 
            ? { ...i, ...formData } 
            : i
          )
        );
        
        toast.success('Article mis à jour avec succès');
      } else {
        // Création
        const newItem = await inventoryApi.create(formData);
        
        // Ajouter à l'état local
        setItems(prev => [...prev, newItem]);
        
        toast.success('Article créé avec succès');
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      toast.error(currentItem 
        ? 'Erreur lors de la mise à jour de l\'article' 
        : 'Erreur lors de la création de l\'article'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!currentItem) return;
    
    try {
      setIsSubmitting(true);
      await inventoryApi.delete(currentItem.id);
      
      // Mettre à jour l'état local
      setItems(prev => prev.filter(i => i.id !== currentItem.id));
      
      setIsDeleteModalOpen(false);
      toast.success('Article supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression de l\'article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = async (key: keyof InventoryItem, direction: 'asc' | 'desc') => {
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
      
      const data = await inventoryApi.getAll(params);
      setItems(data);
    } catch (err) {
      console.error('Erreur lors du tri:', err);
      toast.error('Erreur lors du tri de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Inventaire" 
        onAdd={handleAddItem} 
        onSearch={handleSearch} 
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement de l'inventaire...</p>
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
              data={items}
              columns={columns}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
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

      {/* Modal pour ajouter/éditer un article */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={currentItem ? "Modifier l'article" : "Ajouter un article"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom de l'article *
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
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="Fournitures">Fournitures</option>
                <option value="Équipement">Équipement</option>
                <option value="Matières premières">Matières premières</option>
                <option value="Produits finis">Produits finis</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantité *
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                required
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
                Prix unitaire (€) *
              </label>
              <input
                type="number"
                name="unit_price"
                id="unit_price"
                required
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                Fournisseur
              </label>
              <input
                type="text"
                name="supplier"
                id="supplier"
                value={formData.supplier || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Emplacement
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

            <div>
              <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700">
                Niveau de réapprovisionnement
              </label>
              <input
                type="number"
                name="reorder_level"
                id="reorder_level"
                min="0"
                step="1"
                value={formData.reorder_level || ''}
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
              ) : currentItem ? 'Mettre à jour' : 'Créer'}
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
          <p className="mb-4">Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.</p>
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

export default Inventory;
