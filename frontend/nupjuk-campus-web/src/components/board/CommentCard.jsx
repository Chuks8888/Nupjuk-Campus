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
    setEditBody(comment.body);
  };

  return (
    <div className="comment-card">
      <div className="comment-header">
        <div>
          <span className="comment-author">
            {comment.author?.displayName || comment.author?.kaistEmail || 'Unknown'}
          </span>
          <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>

        {isAuthor && !isEditing && (
          <div className="comment-actions">
            <button onClick={() => setIsEditing(true)} className="icon-button">
              <Edit2 size={16} />
            </button>
            <button onClick={() => onDelete(comment.id)} className="icon-button comment-delete-btn">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="comment-edit-container">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="board-input comment-textarea"
          />
          <div className="comment-edit-actions">
            <button onClick={handleCancel} className="btn-secondary">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} className="btn-primary">
              <Save size={16} /> Save
            </button>
          </div>
        </div>
      ) : (
        <p className="comment-body">{comment.body}</p>
      )}
    </div>
  );
}
