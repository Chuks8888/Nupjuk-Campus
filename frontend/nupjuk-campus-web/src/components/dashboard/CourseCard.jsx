import { Book } from 'lucide-react';
import '../../styles/Cards.css';

export default function CourseCard({ course }) {
  return (
    <div className="card">
      <div className="card-icon">
        <Book size={24} color="var(--accent-color)" />
      </div>
      <div className="card-content">
        <h3>{course.course_code}</h3>
        <p>{course.course_name}</p>
      </div>
    </div>
  );
}