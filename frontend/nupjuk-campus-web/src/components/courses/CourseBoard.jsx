import { MessageSquare, Paperclip } from 'lucide-react';
import DetailCard from '../common/DetailCard';

export default function CourseBoard({ posts }) {
  if (!posts || posts.length === 0) return <p className="empty-state">No posts yet.</p>;

  return (
    <div className="detail-list-container">
      {posts.map((post) => (
        <DetailCard
          key={post.id}
          category={post.category}
          author={post.author_name}
          title={post.title}
          description={post.body}
          metaLeft={
            <>
              <MessageSquare size={14} /> {post.comment_count}
            </>
          }
          metaRight={
            <>
              <Paperclip size={14} /> {post.attachment_count}
            </>
          }
        />
      ))}
    </div>
  );
}
