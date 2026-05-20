import { FileText, Calendar, Users } from 'lucide-react';

export default function CourseTabs({ activeTab, onTabChange }) {
  // Define our tabs and their corresponding lucide-react icons
  const tabs = [
    { id: 'board', label: 'Board', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: Calendar },
    { id: 'meetings', label: 'Meetings', icon: Users }
  ];

  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #e5e5ea', marginBottom: '1.5rem' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid #007AFF' : '2px solid transparent',
              color: isActive ? '#007AFF' : '#8e8e93',
              fontWeight: isActive ? '600' : '400',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon size={18} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}