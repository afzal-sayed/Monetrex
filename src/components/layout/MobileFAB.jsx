import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddExpenseModal } from '../features/AddExpenseModal';

export const MobileFAB = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* FAB Button — visible only on mobile (md:hidden) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 z-[45] w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Add transaction"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Modal */}
      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
