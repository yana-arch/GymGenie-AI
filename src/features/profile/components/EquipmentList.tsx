import React from 'react';
import { useApp } from '@/context/AppContext';
import { Dumbbell, Plus, Trash2, ScanLine } from 'lucide-react';
import { removeEquipment } from '@/src/features/user/store/userSlice';
import { useDispatch } from 'react-redux';

interface EquipmentListProps {
  onScanMore: () => void;
}

const EquipmentList: React.FC<EquipmentListProps> = ({ onScanMore }) => {
  const { equipment, setEquipment: setContextEquipment } = useApp();
  const dispatch = useDispatch();

  const handleRemove = (item: string) => {
    dispatch(removeEquipment(item));
    // Also update context
    const newEquipment = equipment.filter(e => e !== item);
    setContextEquipment(newEquipment);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Dumbbell size={20} className="text-brand-600 dark:text-brand-400" />
            My Equipment
        </h3>
        <button 
            onClick={onScanMore}
            className="text-sm font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
            <ScanLine size={16} /> Scan More
        </button>
      </div>

      {equipment.length > 0 ? (
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {equipment.map((item, index) => (
                <div key={`${item}-${index}`} className="group flex items-center gap-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500 hover:shadow-sm transition-all">
                    <span>{item}</span>
                    <button 
                        onClick={() => handleRemove(item)}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        title="Remove item"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No equipment added yet</p>
            <button 
                onClick={onScanMore}
                className="mt-2 text-sm text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
                Start Scanning
            </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(EquipmentList);
