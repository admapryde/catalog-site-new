import { Product } from '@/types';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  selectedProducts: Product[];
}

export default function BulkDeleteModal({ isOpen, onClose, onDelete, selectedProducts }: BulkDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Подтвердите удаление</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Вы собираетесь удалить <strong>{selectedProducts.length}</strong> товар(ов). 
              Это действие нельзя отменить.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
              <h3 className="font-medium text-gray-700 mb-2">Список товаров для удаления:</h3>
              <ul className="space-y-1">
                {selectedProducts.map((product) => (
                  <li key={product.id} className="text-sm text-gray-600 flex items-start">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-2"></span>
                    <span className="truncate">{product.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
            >
              Отмена
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}