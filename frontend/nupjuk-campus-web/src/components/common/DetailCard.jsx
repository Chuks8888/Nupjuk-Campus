import '../../styles/Cards.css';
export default function DetailCard({ category, author, title, description, metaLeft, metaRight }) {
  return (
    <article className="detail-card">
      <div className="detail-card-header">
        <span className="detail-card-category">{category}</span>
        <span className="detail-card-author">{author}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="detail-card-meta">
        <span>{metaLeft}</span>
        <span>{metaRight}</span>
      </div>
    </article>
  );
}
