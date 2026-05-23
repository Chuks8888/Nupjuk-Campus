import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getPrefixColor } from '../../utils/colorUtils';
import '../../styles/Cards.css';

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const prefix = course.course_code.replace(/[0-9]/g, '');

  return (
    <div className="card" onClick={() => navigate(`/courses/${course.id}`)}>
      <div className="card-icon course-icon" style={{ backgroundColor: getPrefixColor(prefix) }}>
        {prefix}
      </div>

      <div className="card-content">
        <h3>{course.course_code}</h3>
        <p>{course.course_name}</p>
      </div>

      <ChevronRight color="var(--text-muted)" />
    </div>
  );
}
