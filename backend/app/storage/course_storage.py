"""Database storage for courses."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.course import Course as CourseModel
from app.schemas.course import Course


class CourseStorage:
    """Database storage for courses."""

    def __init__(self, session: Session):
        """
        Initialize storage with database session.

        Args:
            session: SQLAlchemy database session
        """
        self._session = session

    def get(self, course_id: int) -> Course | None:
        """
        Get a course by ID.

        Args:
            course_id: Course ID

        Returns:
            Course or None if not found
        """
        stmt = select(CourseModel).where(CourseModel.id == course_id)
        db_course = self._session.scalar(stmt)

        if db_course is None:
            return None

        return Course.model_validate(db_course)

    def get_by_code_and_university(self, code: str, university_name: str) -> Course | None:
        """
        Get a course by code and university name (case-insensitive).

        Args:
            code: Course code
            university_name: University name

        Returns:
            Course or None if not found
        """
        stmt = select(CourseModel).where(
            func.lower(CourseModel.code) == code.lower(),
            func.lower(CourseModel.university) == university_name.lower(),
        )
        db_course = self._session.scalar(stmt)

        if db_course is None:
            return None

        return Course.model_validate(db_course)

    def create(self, code: str, name: str, university_id: int, university_name: str) -> Course:
        """
        Create a new course.

        Args:
            code: Course code
            name: Course name
            university_id: University ID
            university_name: University name (denormalized)

        Returns:
            Created course
        """
        db_course = CourseModel(
            code=code,
            name=name,
            university_id=university_id,
            university=university_name,
            review_count=0,
        )

        self._session.add(db_course)
        self._session.flush()
        self._session.refresh(db_course)

        return Course.model_validate(db_course)

    def get_or_create(self, code: str, name: str, university_id: int, university_name: str) -> Course:
        """
        Get a course by code and university, or create it if it doesn't exist.

        Args:
            code: Course code
            name: Course name (used only if creating)
            university_id: University ID
            university_name: University name

        Returns:
            Existing or newly created course
        """
        course = self.get_by_code_and_university(code, university_name)
        if course:
            return course
        return self.create(code, name, university_id, university_name)

    def list_courses(
        self,
        *,
        code: str | None = None,
        university: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Course]:
        """
        List courses with optional filtering.

        Args:
            code: Filter by course code (case-insensitive partial match)
            university: Filter by university name (case-insensitive exact match)
            skip: Number of courses to skip
            limit: Maximum number of courses to return

        Returns:
            List of courses with review counts and university names
        """
        stmt = select(CourseModel)

        # Filter by code if provided (case-insensitive partial match)
        if code:
            stmt = stmt.where(func.lower(CourseModel.code).contains(code.lower()))

        # Filter by university if provided (case-insensitive exact match)
        if university:
            stmt = stmt.where(func.lower(CourseModel.university) == university.lower())

        # Sort by university then code for consistency
        stmt = stmt.order_by(CourseModel.university, CourseModel.code).offset(skip).limit(limit)

        db_courses = self._session.scalars(stmt).all()

        return [Course.model_validate(c) for c in db_courses]
