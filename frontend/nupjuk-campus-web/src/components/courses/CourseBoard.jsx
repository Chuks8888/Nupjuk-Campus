import { MessageSquare, Paperclip } from 'lucide-react';

export default function CourseBoard({ posts }) {
  if (!posts || posts.length === 0) {
    return <p className="empty-state">No posts yet.</p>;
  }

  return (
    <div className="course-board-list">
      {posts.map((post) => (
        <article className="board-post-card" key={post.id}>
          <div className="board-post-header">
            <span className="board-post-category">{post.category}</span>
            <span className="board-post-author">{post.author_name}</span>
          </div>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <div className="board-post-meta">
            <span>
              <MessageSquare size={14} /> {post.comment_count}
            </span>
            <span>
              <Paperclip size={14} /> {post.attachment_count}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
