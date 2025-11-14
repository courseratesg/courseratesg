"""Update course_name from course table

Revision ID: f46d02669629
Revises: 9a573e065c32
Create Date: 2025-11-15 00:02:31.337242

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f46d02669629"
down_revision: str | Sequence[str] | None = "9a573e065c32"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """
    Update course_name in reviews table from course table.

    This migration fixes reviews where course_name was set to course_code
    by populating it with the actual course name from the courses table.
    """
    # Update course_name from course table where there's a match
    op.execute(
        """
        UPDATE reviews
        SET course_name = courses.name
        FROM courses
        WHERE LOWER(reviews.course_code) = LOWER(courses.code)
          AND LOWER(reviews.university_name) = LOWER(courses.university)
          AND reviews.course_name = reviews.course_code
    """
    )


def downgrade() -> None:
    """
    Downgrade: restore course_name to course_code for affected rows.

    Note: This is a lossy operation - we can't restore the original values
    if they were different from course_code.
    """
    # Restore to course_code (best effort)
    op.execute(
        """
        UPDATE reviews
        SET course_name = reviews.course_code
        FROM courses
        WHERE LOWER(reviews.course_code) = LOWER(courses.code)
          AND LOWER(reviews.university_name) = LOWER(courses.university)
          AND reviews.course_name = courses.name
    """
    )
