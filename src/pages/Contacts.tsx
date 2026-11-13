import React, { useState } from 'react';
import { Plus, Shield, Users } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { EmergencyContactCard } from '../components/EmergencyContactCard';
import { EmergencyContact } from '../types/safety';

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15 && /^[+\d\s()-]+$/.test(phone);
}

export const Contacts: React.FC = () => {
  const {
    contacts,
    settings,
    updateSettings,
    addContact,
    updateContact,
    removeContact,
  } = useSafety();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [isPreferred, setIsPreferred] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setEmail('');
    setRelationship('Family');
    setIsPreferred(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter a valid contact name (at least 2 characters).');
      return;
    }
    if (!isValidPhone(phone.trim())) {
      setError('Please enter a valid phone number (7–15 digits, optional + prefix).');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address or leave it blank.');
      return;
    }

    setError(null);
    if (editingId) {
      updateContact(editingId, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        relationship: relationship.trim() || 'Trusted Contact',
        isPreferred,
      });
    } else {
      addContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        relationship: relationship.trim() || 'Trusted Contact',
        isPreferred,
      });
    }
    resetForm();
  };

  const handleEdit = (c: EmergencyContact) => {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email ?? '');
    setRelationship(c.relationship);
    setIsPreferred(c.isPreferred);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          Emergency Contact Management
        </h2>
        <p className="text-sm text-[#4B4560]">
          Configure trusted contacts for user-initiated SOS SMS and email sharing. Stored strictly in your browser with your consent—never uploaded to any server.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white border border-[#EAE4F2] flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3 text-xs text-[#4B4560] max-w-2xl">
          <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            LocalStorage Persistence Consent:{' '}
            <strong className="text-[#1E1B2E]">
              {settings.localStorageConsentGranted ? 'Granted' : 'Session-Only (Not Saved)'}
            </strong>
            . Toggle off if you prefer contacts to exist only in memory for this session.
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            updateSettings({
              localStorageConsentGranted: !settings.localStorageConsentGranted,
            })
          }
          className="px-3.5 py-1.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-medium text-[#342E49] whitespace-nowrap cursor-pointer"
        >
          {settings.localStorageConsentGranted
            ? 'Switch to Session-Only'
            : 'Allow Local Storage'}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-4 shadow-xs"
      >
        <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
          {editingId ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label htmlFor="cnt-name" className="block text-xs font-medium text-[#342E49]">
              Full Name *
            </label>
            <input
              id="cnt-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Priya Sharma"
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cnt-phone" className="block text-xs font-medium text-[#342E49]">
              Phone Number *
            </label>
            <input
              id="cnt-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cnt-email" className="block text-xs font-medium text-[#342E49]">
              Email (Optional)
            </label>
            <input
              id="cnt-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cnt-rel" className="block text-xs font-medium text-[#342E49]">
              Relationship
            </label>
            <input
              id="cnt-rel"
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Family / Friend"
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-[#342E49] cursor-pointer">
            <input
              type="checkbox"
              checked={isPreferred}
              onChange={(e) => setIsPreferred(e.target.checked)}
              className="h-4 w-4 rounded border-purple-300 text-purple-600"
            />
            <span>Mark as preferred SOS recipient</span>
          </label>

          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-medium text-[#342E49] cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{editingId ? 'Save Changes' : 'Add Contact'}</span>
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
          Saved Contacts ({contacts.length})
        </h3>
        {contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((c) => (
              <EmergencyContactCard
                key={c.id}
                contact={c}
                onTogglePreferred={(id, next) =>
                  updateContact(id, { isPreferred: next })
                }
                onEdit={handleEdit}
                onDelete={removeContact}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-white border border-[#EAE4F2] text-center space-y-2 shadow-xs">
            <Users className="w-6 h-6 text-[#8E86A4] mx-auto" aria-hidden="true" />
            <div className="text-sm font-medium text-[#1E1B2E]">
              No emergency contacts saved yet
            </div>
            <p className="text-xs text-[#5B5570]">
              Add at least one trusted contact above so SOS SMS and Email links can pre-fill their details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
