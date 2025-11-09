"""Centralized data store for all entities.

This module provides a DataStore class that acts as a data access layer.
Similar to a database session in SQLAlchemy.
When migrating to a database, this class will be replaced with a DB session wrapper.
"""

from datetime import datetime

from app.schemas.course import Course, CourseCreate
from app.schemas.professor import Professor, ProfessorCreate
from app.schemas.review import Review, ReviewCreate, ReviewUpdate
from app.schemas.university import University, UniversityCreate


class DataStore:
    """
    Central data store for all entities.

    This class encapsulates all data access logic and provides a clean interface
    for storage classes to access data. Similar to a database session in real applications.

    When migrating to a database:
    - This class becomes a wrapper around SQLAlchemy session
    - Method implementations change from dict operations to DB queries
    - Interface remains the same for storage classes
    """

    def __init__(self):
        """Initialize the data store."""
        self._universities: dict[int, University] = {}
        self._professors: dict[int, Professor] = {}
        self._courses: dict[int, Course] = {}
        self._reviews: dict[int, Review] = {}
        self._next_university_id: int = 1
        self._next_professor_id: int = 1
        self._next_course_id: int = 1
        self._next_review_id: int = 1
        self._initialize_sample_data()

    def get_all_reviews(self) -> list[Review]:
        """
        Get all reviews from storage.

        Returns:
            List of all reviews
        """
        return list(self._reviews.values())

    def get_review(self, review_id: int) -> Review | None:
        """
        Get a single review by ID.

        Args:
            review_id: Review ID

        Returns:
            Review if found, None otherwise
        """
        return self._reviews.get(review_id)

    def create_review(self, review_in: ReviewCreate, user_id: str | None = None) -> Review:
        """
        Create a new review.

        Args:
            review_in: Review creation data
            user_id: User ID (Cognito sub) - optional for backward compatibility

        Returns:
            Created review with ID and timestamps
        """
        review_data = review_in.model_dump()
        review_data["id"] = self._next_review_id
        review_data["user_id"] = user_id
        review_data["created_at"] = datetime.utcnow()
        review_data["updated_at"] = datetime.utcnow()

        review = Review(**review_data)
        self._reviews[self._next_review_id] = review
        self._next_review_id += 1

        return review

    def update_review(self, review_id: int, review_in: ReviewUpdate) -> Review | None:
        """
        Update an existing review.

        Args:
            review_id: Review ID
            review_in: Review update data

        Returns:
            Updated review if found, None otherwise
        """
        review = self._reviews.get(review_id)
        if not review:
            return None

        update_data = review_in.model_dump(exclude_unset=True)
        updated_fields = {**review.model_dump(), **update_data}
        updated_fields["updated_at"] = datetime.utcnow()

        updated_review = Review(**updated_fields)
        self._reviews[review_id] = updated_review

        return updated_review

    def delete_review(self, review_id: int) -> bool:
        """
        Delete a review.

        Args:
            review_id: Review ID

        Returns:
            True if deleted, False if not found
        """
        if review_id in self._reviews:
            del self._reviews[review_id]
            return True
        return False

    def clear_all_data(self) -> None:
        """
        Clear all data from storage.

        Useful for testing. In production with database, this would not exist.
        """
        self._universities.clear()
        self._professors.clear()
        self._courses.clear()
        self._reviews.clear()
        self._next_university_id = 1
        self._next_professor_id = 1
        self._next_course_id = 1
        self._next_review_id = 1

    # ==================== University Methods ====================

    def get_all_universities(self) -> list[University]:
        """
        Get all universities from storage.

        Returns:
            List of all universities
        """
        return list(self._universities.values())

    def get_university(self, university_id: int) -> University | None:
        """
        Get a single university by ID.

        Args:
            university_id: University ID

        Returns:
            University if found, None otherwise
        """
        return self._universities.get(university_id)

    def get_university_by_name(self, name: str) -> University | None:
        """
        Get a university by name (case-insensitive exact match).

        Args:
            name: University name

        Returns:
            University if found, None otherwise
        """
        for university in self._universities.values():
            if university.name.lower() == name.lower():
                return university
        return None

    def create_university(self, university_in: UniversityCreate) -> University:
        """
        Create a new university.

        Args:
            university_in: University creation data

        Returns:
            Created university with ID
        """
        university_data = university_in.model_dump()
        university_data["id"] = self._next_university_id
        university_data["review_count"] = 0

        university = University(**university_data)
        self._universities[self._next_university_id] = university
        self._next_university_id += 1

        return university

    # ==================== Professor Methods ====================

    def get_all_professors(self) -> list[Professor]:
        """
        Get all professors from storage.

        Returns:
            List of all professors
        """
        return list(self._professors.values())

    def get_professor(self, professor_id: int) -> Professor | None:
        """
        Get a single professor by ID.

        Args:
            professor_id: Professor ID

        Returns:
            Professor if found, None otherwise
        """
        return self._professors.get(professor_id)

    def create_professor(self, professor_in: ProfessorCreate) -> Professor:
        """
        Create a new professor.

        Args:
            professor_in: Professor creation data

        Returns:
            Created professor with ID
        """
        professor_data = professor_in.model_dump()
        professor_data["id"] = self._next_professor_id
        professor_data["review_count"] = 0

        # Get university name
        university = self.get_university(professor_in.university_id)
        if university:
            professor_data["university"] = university.name
        else:
            raise ValueError(f"University with ID {professor_in.university_id} not found")

        professor = Professor(**professor_data)
        self._professors[self._next_professor_id] = professor
        self._next_professor_id += 1

        return professor

    # ==================== Course Methods ====================

    def get_all_courses(self) -> list[Course]:
        """
        Get all courses from storage.

        Returns:
            List of all courses
        """
        return list(self._courses.values())

    def get_course(self, course_id: int) -> Course | None:
        """
        Get a single course by ID.

        Args:
            course_id: Course ID

        Returns:
            Course if found, None otherwise
        """
        return self._courses.get(course_id)

    def create_course(self, course_in: CourseCreate) -> Course:
        """
        Create a new course.

        Args:
            course_in: Course creation data

        Returns:
            Created course with ID
        """
        course_data = course_in.model_dump()
        course_data["id"] = self._next_course_id
        course_data["review_count"] = 0

        # Get university name
        university = self.get_university(course_in.university_id)
        if university:
            course_data["university"] = university.name
        else:
            raise ValueError(f"University with ID {course_in.university_id} not found")

        course = Course(**course_data)
        self._courses[self._next_course_id] = course
        self._next_course_id += 1

        return course

    def _initialize_sample_data(self):
        """Initialize with sample data for testing."""
        # Create sample universities
        nus = self.create_university(UniversityCreate(name="NUS"))
        ntu = self.create_university(UniversityCreate(name="NTU"))
        smu = self.create_university(UniversityCreate(name="SMU"))

        # Create sample professors
        self.create_professor(ProfessorCreate(name="Dr. Sarah Johnson", university_id=nus.id))
        self.create_professor(ProfessorCreate(name="Prof. Michael Chen", university_id=ntu.id))
        self.create_professor(ProfessorCreate(name="Dr. Emily Rodriguez", university_id=smu.id))
        self.create_professor(ProfessorCreate(name="Dr. Robert Kim", university_id=nus.id))

        # Create sample courses
        self.create_course(CourseCreate(code="CS101", name="Introduction to Computer Science", university_id=nus.id))
        self.create_course(CourseCreate(code="CS201", name="Data Structures and Algorithms", university_id=ntu.id))
        self.create_course(CourseCreate(code="MATH220", name="Calculus II", university_id=smu.id))
        self.create_course(CourseCreate(code="PHYS101", name="General Physics I", university_id=nus.id))

        # Create sample reviews
        sample_reviews = [
            ReviewCreate(
                overall_rating=4.5,
                difficulty_rating=3.0,
                workload_rating=3.5,
                comment="Great introduction to programming concepts. Dr. Johnson explains complex topics clearly.",
                semester="AY2023/24 Sem 1",
                year=2023,
                course_code="CS101",
                university="NUS",
                professor_name="Dr. Sarah Johnson",
            ),
            ReviewCreate(
                overall_rating=3.8,
                difficulty_rating=4.2,
                workload_rating=4.0,
                comment="Challenging course but very rewarding. The professor is knowledgeable but moves fast.",
                semester="AY2023/24 Sem 2",
                year=2023,
                course_code="CS201",
                university="NTU",
                professor_name="Prof. Michael Chen",
            ),
            ReviewCreate(
                overall_rating=4.2,
                difficulty_rating=2.8,
                workload_rating=3.2,
                comment="Perfect for beginners. Assignments are fair and help reinforce the material.",
                semester="AY2023/24 Sem 1",
                year=2023,
                course_code="CS101",
                university="NUS",
                professor_name="Dr. Sarah Johnson",
            ),
            ReviewCreate(
                overall_rating=3.5,
                difficulty_rating=3.2,
                workload_rating=3.0,
                comment="Solid introduction with practical examples. Workload is manageable.",
                semester="AY2023/24 Sem 1",
                year=2023,
                course_code="CS101",
                university="NUS",
                professor_name="Dr. Sarah Johnson",
            ),
        ]

        for review_in in sample_reviews:
            self.create_review(review_in)
