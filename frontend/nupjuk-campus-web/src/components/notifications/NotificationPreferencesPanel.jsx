const DEADLINE_TIMINGS = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '24 hours' },
  { value: '3d', label: '3 days' },
];

const PREFERENCE_FIELDS = [
  { key: 'post_comment_enabled', label: 'Comments' },
  { key: 'deadline_enabled', label: 'Deadlines' },
  { key: 'meeting_enabled', label: 'Meetings' },
  { key: 'email_enabled', label: 'Email' },
];

function getPreferenceTitle(preference) {
  if (preference.course) {
    return `${preference.course.course_code} ${preference.course.course_name}`;
  }

  return 'Global preferences';
}

function normalizeTimings(value) {
  return Array.isArray(value) ? value : [];
}

export default function NotificationPreferencesPanel({
  preferences,
  error,
  savingPreferenceId,
  onPreferenceChange,
  onCreateDefaultPreference,
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
          <p className="empty-state">No notification preferences found.</p>
          <button
            type="button"
            className="alerts-action-button"
            onClick={onCreateDefaultPreference}
            disabled={Boolean(savingPreferenceId)}
          >
            Create preferences
          </button>
        </div>
      ) : (
        <div className="preferences-list">
          {preferences.map((preference) => {
            const timings = normalizeTimings(preference.deadline_reminder_timing);
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
                  <div className="timing-options">
                    {DEADLINE_TIMINGS.map((timing) => {
                      const isChecked = timings.includes(timing.value);

                      return (
                        <label className="timing-chip" key={timing.value}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSaving || !preference.deadline_enabled}
                            onChange={(event) => {
                              const nextTimings = event.target.checked
                                ? [...timings, timing.value]
                                : timings.filter((value) => value !== timing.value);

                              onPreferenceChange(preference.id, {
                                deadline_reminder_timing: nextTimings,
                              });
                            }}
                          />
                          <span>{timing.label}</span>
                        </label>
                      );
                    })}
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
