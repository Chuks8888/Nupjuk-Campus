const PREFERENCE_FIELDS = [
  { key: 'post_comment_enabled', label: 'Comments' },
  { key: 'deadline_enabled', label: 'Deadlines' },
  { key: 'meeting_enabled', label: 'Meetings' },
  { key: 'email_enabled', label: 'Email' },
];

function getPreferenceTitle(preference) {
  if (preference.course) {
    return `${preference.course.courseCode ?? preference.course.course_code} ${preference.course.courseName ?? preference.course.course_name}`;
  }
  return 'Global preferences';
}

export default function NotificationPreferencesPanel({
  preferences,
  error,
  savingPreferenceId,
  onPreferenceChange,
}) {
  return (
    <div className="preferences-panel">
      <div className="preferences-header">
        <h2>Preferences</h2>
        <span className="meta-text">{preferences.length} set</span>
      </div>

      {error && <p className="preferences-error">{error}</p>}

      {preferences.length === 0 ? (
        <div className="preferences-empty">
          <p className="empty-state">
            No notification preferences found. Enable them from within a Course.
          </p>
        </div>
      ) : (
        <div className="preferences-list">
          {preferences.map((preference) => {
            const isSaving = savingPreferenceId === preference.id;

            return (
              <section className="preference-card" key={preference.id}>
                <div className="preference-title-row">
                  <h3>{getPreferenceTitle(preference)}</h3>
                  {isSaving && <span className="saving-text">Saving...</span>}
                </div>

                <div className="preference-switch-grid">
                  {PREFERENCE_FIELDS.map((field) => (
                    <label className="preference-switch" key={field.key}>
                      <span>{field.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(preference[field.key])}
                        disabled={isSaving}
                        onChange={(event) =>
                          onPreferenceChange(preference.id, {
                            [field.key]: event.target.checked,
                          })
                        }
                      />
                    </label>
                  ))}
                </div>

                <div className="deadline-timings">
                  <span className="deadline-timings-label">Deadline reminders</span>
                  <div
                    className="timing-static-info"
                    style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
                  >
                    {/* Reverted to deadline_enabled */}
                    {preference.deadline_enabled ? (
                      <p>
                        Reminders will be sent automatically <strong>24 hours</strong> and{' '}
                        <strong>3 hours</strong> before the deadline.
                      </p>
                    ) : (
                      <p>Deadline reminders are currently disabled.</p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
