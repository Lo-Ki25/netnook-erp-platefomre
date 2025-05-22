import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { financeApi } from '../api/api';

// Types
interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  invoice_id?: number;
  invoice_number?: string;
  amount: number;
  type: string;
  category?: string;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceFormData {
  client_id: number;
  amount: number;
  status: string;
  issue_date: string;
  due_date?: string;
  paid_date?: string;
}

interface TransactionFormData {
  invoice_id?: number;
  amount: number;
  type: string;
  category?: string;
  description?: string;
  date: string;
}

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'transactions'>('invoices');
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  
  const [invoiceFormData, setInvoiceFormData] = useState<InvoiceFormData>({
    client_id: 0,
    amount: 0,
    status: 'En attente',
    issue_date: new Date().toISOString().split('T')[0]
  });
  
  const [transactionFormData, setTransactionFormData] = useState<TransactionFormData>({
    amount: 0,
    type: 'Revenu',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'invoice' | 'transaction', id: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<{id: number, name: string}[]>([]);

  // Colonnes pour le tableau des factures
  const invoiceColumns = [
    { key: 'invoice_number', header: 'N° Facture', sortable: true },
    { key: 'client_name', header: 'Client', sortable: true },
    { 
      key: 'amount', 
      header: 'Montant', 
      sortable: true,
      render: (invoice: Invoice) => `${invoice.amount.toLocaleString()} €`
    },
    { key: 'status', header: 'Statut', sortable: true },
    { 
      key: 'issue_date', 
      header: 'Date d\'émission', 
      sortable: true,
      render: (invoice: Invoice) => new Date(invoice.issue_date).toLocaleDateString()
    },
    { 
      key: 'due_date', 
      header: 'Échéance', 
      sortable: true,
      render: (invoice: Invoice) => invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'
    },
    { key: 'actions', header: 'Actions' }
  ];

  // Colonnes pour le tableau des transactions
  const transactionColumns = [
    { 
      key: 'date', 
      header: 'Date', 
      sortable: true,
      render: (transaction: Transaction) => new Date(transaction.date).toLocaleDateString()
    },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'category', header: 'Catégorie', sortable: true },
    { 
      key: 'amount', 
      header: 'Montant', 
      sortable: true,
      render: (transaction: Transaction) => `${transaction.amount.toLocaleString()} €`
    },
    { key: 'invoice_number', header: 'N° Facture', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    { key: 'actions', header: 'Actions' }
  ];

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        
        if (activeTab === 'invoices') {
          const data = await financeApi.getAllInvoices(params);
          setInvoices(data);
          setTotalItems(data.length); // Dans une API réelle, cela viendrait d'un header ou d'une métadonnée
        } else {
          const data = await financeApi.getAllTransactions(params);
          setTransactions(data);
          setTotalItems(data.length);
        }
        
        setError(null);
      } catch (err) {
        console.error(`Erreur lors du chargement des ${activeTab === 'invoices' ? 'factures' : 'transactions'}:`, err);
        setError(`Impossible de charger les ${activeTab === 'invoices' ? 'factures' : 'transactions'}. Veuillez réessayer plus tard.`);
        toast.error(`Erreur lors du chargement des ${activeTab === 'invoices' ? 'factures' : 'transactions'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, currentPage, itemsPerPage, searchQuery]);

  // Charger les clients pour le formulaire
  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Normalement, on utiliserait clientsApi.getAll() ici
        // Pour l'exemple, on utilise des données statiques
        setClients([
          { id: 1, name: 'Mode Élégance' },
          { id: 2, name: 'FoodExpress' },
          { id: 3, name: 'Studio Design' }
        ]);
      } catch (err) {
        console.error('Erreur lors du chargement des clients:', err);
        toast.error('Erreur lors du chargement des clients');
      }
    };

    fetchClients();
  }, []);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddInvoice = () => {
    setCurrentInvoice(null);
    setInvoiceFormData({
      client_id: clients.length > 0 ? clients[0].id : 0,
      amount: 0,
      status: 'En attente',
      issue_date: new Date().toISOString().split('T')[0]
    });
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setInvoiceFormData({
      client_id: invoice.client_id,
      amount: invoice.amount,
      status: invoice.status,
      issue_date: invoice.issue_date.split('T')[0],
      due_date: invoice.due_date ? invoice.due_date.split('T')[0] : undefined,
      paid_date: invoice.paid_date ? invoice.paid_date.split('T')[0] : undefined
    });
    setIsInvoiceModalOpen(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setItemToDelete({ type: 'invoice', id: invoice.id });
    setIsDeleteModalOpen(true);
  };

  const handleAddTransaction = () => {
    setCurrentTransaction(null);
    setTransactionFormData({
      amount: 0,
      type: 'Revenu',
      date: new Date().toISOString().split('T')[0]
    });
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setTransactionFormData({
      invoice_id: transaction.invoice_id,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date.split('T')[0]
    });
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setItemToDelete({ type: 'transaction', id: transaction.id });
    setIsDeleteModalOpen(true);
  };

  const handleInvoiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'client_id' ? Number(value) : value
    }));
  };

  const handleTransactionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTransactionFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'invoice_id' ? Number(value) : value
    }));
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (currentInvoice) {
        // Mise à jour
        await financeApi.updateInvoice(currentInvoice.id, invoiceFormData);
        
        // Mettre à jour l'état local
        setInvoices(prev => 
          prev.map(i => i.id === currentInvoice.id 
            ? { 
                ...i, 
                ...invoiceFormData,
                client_name: clients.find(c => c.id === invoiceFormData.client_id)?.name || i.client_name
              } 
            : i
          )
        );
        
        toast.success('Facture mise à jour avec succès');
      } else {
        // Création
        const newInvoice = await financeApi.createInvoice(invoiceFormData);
        
        // Ajouter à l'état local
        setInvoices(prev => [...prev, {
          ...newInvoice,
          client_name: clients.find(c => c.id === invoiceFormData.client_id)?.name || 'Client inconnu'
        }]);
        
        toast.success('Facture créée avec succès');
      }
      
      setIsInvoiceModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      toast.error(currentInvoice 
        ? 'Erreur lors de la mise à jour de la facture' 
        : 'Erreur lors de la création de la facture'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (currentTransaction) {
        // Mise à jour
        await financeApi.updateTransaction(currentTransaction.id, transactionFormData);
        
        // Mettre à jour l'état local
        setTransactions(prev => 
          prev.map(t => t.id === currentTransaction.id 
            ? { ...t, ...transactionFormData } 
            : t
          )
        );
        
        toast.success('Transaction mise à jour avec succès');
      } else {
        // Création
        const newTransaction = await financeApi.createTransaction(transactionFormData);
        
        // Ajouter à l'état local
        setTransactions(prev => [...prev, newTransaction]);
        
        toast.success('Transaction créée avec succès');
      }
      
      setIsTransactionModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      toast.error(currentTransaction 
        ? 'Erreur lors de la mise à jour de la transaction' 
        : 'Erreur lors de la création de la transaction'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      setIsSubmitting(true);
      
      if (itemToDelete.type === 'invoice') {
        await financeApi.deleteInvoice(itemToDelete.id);
        setInvoices(prev => prev.filter(i => i.id !== itemToDelete.id));
      } else {
        await financeApi.deleteTransaction(itemToDelete.id);
        setTransactions(prev => prev.filter(t => t.id !== itemToDelete.id));
      }
      
      setIsDeleteModalOpen(false);
      toast.success(`${itemToDelete.type === 'invoice' ? 'Facture' : 'Transaction'} supprimée avec succès`);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error(`Erreur lors de la suppression de la ${itemToDelete.type === 'invoice' ? 'facture' : 'transaction'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = async (key: string, direction: 'asc' | 'desc') => {
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
      
      if (activeTab === 'invoices') {
        const data = await financeApi.getAllInvoices(params);
        setInvoices(data);
      } else {
        const data = await financeApi.getAllTransactions(params);
        setTransactions(data);
      }
    } catch (err) {
      console.error('Erreur lors du tri:', err);
      toast.error(`Erreur lors du tri des ${activeTab === 'invoices' ? 'factures' : 'transactions'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Finance" 
        onAdd={activeTab === 'invoices' ? handleAddInvoice : handleAddTransaction} 
        onSearch={handleSearch} 
      />
      
      <div className="mt-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`${
              activeTab === 'invoices'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Factures
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`${
              activeTab === 'transactions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Transactions
          </button>
        </nav>
      </div>
      
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500">Chargement des {activeTab === 'invoices' ? 'factures' : 'transactions'}...</p>
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
        ) : activeTab === 'invoices' ? (
          <>
            <DataTable 
              data={invoices}
              columns={invoiceColumns}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
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
        ) : (
          <>
            <DataTable 
              data={transactions}
              columns={transactionColumns}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
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

      {/* Modal pour ajouter/éditer une facture */}
      <Modal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => !isSubmitting && setIsInvoiceModalOpen(false)}
        title={currentInvoice ? "Modifier la facture" : "Ajouter une facture"}
        size="lg"
      >
        <form onSubmit={handleInvoiceSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                Client *
              </label>
              <select
                name="client_id"
                id="client_id"
                required
                value={invoiceFormData.client_id}
                onChange={handleInvoiceInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Montant (€) *
              </label>
              <input
                type="number"
                name="amount"
                id="amount"
                required
                min="0"
                step="0.01"
                value={invoiceFormData.amount}
                onChange={handleInvoiceInputChange}
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
                value={invoiceFormData.status}
                onChange={handleInvoiceInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="En attente">En attente</option>
                <option value="Payée">Payée</option>
                <option value="En retard">En retard</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>

            <div>
              <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
                Date d'émission *
              </label>
              <input
                type="date"
                name="issue_date"
                id="issue_date"
                required
                value={invoiceFormData.issue_date}
                onChange={handleInvoiceInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Date d'échéance
              </label>
              <input
                type="date"
                name="due_date"
                id="due_date"
                value={invoiceFormData.due_date || ''}
                onChange={handleInvoiceInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="paid_date" className="block text-sm font-medium text-gray-700">
                Date de paiement
              </label>
              <input
                type="date"
                name="paid_date"
                id="paid_date"
                value={invoiceFormData.paid_date || ''}
                onChange={handleInvoiceInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
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
              ) : currentInvoice ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal pour ajouter/éditer une transaction */}
      <Modal 
        isOpen={isTransactionModalOpen} 
        onClose={() => !isSubmitting && setIsTransactionModalOpen(false)}
        title={currentTransaction ? "Modifier la transaction" : "Ajouter une transaction"}
        size="lg"
      >
        <form onSubmit={handleTransactionSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type *
              </label>
              <select
                name="type"
                id="type"
                required
                value={transactionFormData.type}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="Revenu">Revenu</option>
                <option value="Dépense">Dépense</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Montant (€) *
              </label>
              <input
                type="number"
                name="amount"
                id="amount"
                required
                min="0"
                step="0.01"
                value={transactionFormData.amount}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                name="date"
                id="date"
                required
                value={transactionFormData.date}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <input
                type="text"
                name="category"
                id="category"
                value={transactionFormData.category || ''}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="invoice_id" className="block text-sm font-medium text-gray-700">
                Facture associée
              </label>
              <select
                name="invoice_id"
                id="invoice_id"
                value={transactionFormData.invoice_id || ''}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Aucune facture</option>
                {invoices.map(invoice => (
                  <option key={invoice.id} value={invoice.id}>{invoice.invoice_number}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={transactionFormData.description || ''}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsTransactionModalOpen(false)}
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
              ) : currentTransaction ? 'Mettre à jour' : 'Créer'}
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
          <p className="mb-4">
            Êtes-vous sûr de vouloir supprimer {itemToDelete?.type === 'invoice' ? 'cette facture' : 'cette transaction'} ? 
            Cette action est irréversible.
          </p>
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

export default Finance;
