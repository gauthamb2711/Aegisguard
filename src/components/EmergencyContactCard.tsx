import React from 'react';
import { Mail, Pencil, Phone, Star, Trash2 } from 'lucide-react';
import { EmergencyContact } from '../types/safety';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onTogglePreferred: (id: string, nextValue: boolean) => void;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (id: string) => void;
}

export const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  contact,
  onTogglePreferred,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="p-4 rounded-xl bg-white border border-[#EAE4F2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-display text-sm font-semibold text-[#1E1B2E] truncate">
            {contact.name}
          </h4>
          <span className="text-xs text-[#5B5570]">
            · {contact.relationship || 'Trusted Contact'}
          </span>
          {contact.isPreferred && (
            <span className="text-xs text-purple-700 font-semibold">
              · Preferred
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#342E49] font-mono">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#6D6684]" aria-hidden="true" />
            {contact.phone}
          </span>
          {contact.email && (
            <span className="inline-flex items-center gap-1.5 font-sans">
              <Mail className="w-3.5 h-3.5 text-[#6D6684]" aria-hidden="true" />
              {contact.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onTogglePreferred(contact.id, !contact.isPreferred)}
          title={
            contact.isPreferred
              ? 'Remove from preferred contacts'
              : 'Mark as preferred contact'
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            contact.isPreferred
              ? 'bg-purple-50 border-purple-200 text-purple-800'
              : 'bg-[#FAF8FC] border-[#DCD4EA] text-[#4B4560] hover:text-[#1E1B2E]'
          }`}
        >
          <Star
            className={`w-3.5 h-3.5 ${contact.isPreferred ? 'fill-purple-600 text-purple-600' : ''}`}
            aria-hidden="true"
          />
          <span>{contact.isPreferred ? 'Preferred' : 'Set Preferred'}</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(contact)}
          aria-label={`Edit ${contact.name}`}
          className="p-2 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-[#4B4560] hover:text-[#1E1B2E] transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(contact.id)}
          aria-label={`Delete ${contact.name}`}
          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-red-600 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
