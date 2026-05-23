import { FileText, Calendar, Users } from 'lucide-react';

export default function CourseTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'board', label: 'Board', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: Calendar },
    { id: 'meetings', label: 'Meetings', icon: Users },
  ];

  return (
    <div className="course-tabs-container">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`course-tab-button ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
