import { useState } from 'react';
import { Trash2, Edit2, Save, X } from 'lucide-react';

export default function CommentCard({ comment, currentUserId, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);

  const isAuthor = comment.author?.id === currentUserId;

  const handleSave = async () => {
    if (!editBody.trim()) return;
    await onUpdate(comment.id, editBody);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditBody(comment.body); // Revert changes
  };

  return (
    <div
      className="comment"
      style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          color: '#666',
        }}
      >
        <div>
          <strong>{comment.author?.displayName || comment.author?.kaistEmail || 'Unknown'}</strong>
          <span style={{ marginLeft: '0.5rem' }}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Only show edit/delete icons if not currently editing and user is the author */}
        {isAuthor && !isEditing && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#333',
                padding: 0,
              }}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#d32f2f',
                padding: 0,
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div style={{ marginTop: '0.5rem' }}>
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              resize: 'vertical',
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={handleCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.75rem',
                cursor: 'pointer',
                background: '#e0e0e0',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.75rem',
                cursor: 'pointer',
                background: '#0056b3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              <Save size={14} /> Save
            </button>
          </div>
        </div>
      ) : (
        <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{comment.body}</p>
      )}
    </div>
  );
}
