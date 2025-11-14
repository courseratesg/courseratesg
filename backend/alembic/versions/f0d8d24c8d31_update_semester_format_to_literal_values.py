"""Update semester format to literal values

Revision ID: f0d8d24c8d31
Revises: 6f8ce485b8a1
Create Date: 2025-11-15 00:27:40.788458

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f0d8d24c8d31"
down_revision: str | Sequence[str] | None = "6f8ce485b8a1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """
    Update semester format to use literal values.

    Converts old format (e.g., "AY2024/25 Sem 1") to new format ("Semester 1").
    Valid values: "Semester 1", "Semester 2", "Special Term 1", "Special Term 2",
    "Summer Session", "Winter Session"
    """
    # Update semester values to new format
    # Convert "Sem 1" or "Semester 1" patterns to "Semester 1"
    op.execute(
        """
        UPDATE reviews
        SET semester = CASE
            WHEN semester LIKE '%Sem 1%' OR semester LIKE '%Semester 1%' THEN 'Semester 1'
            WHEN semester LIKE '%Sem 2%' OR semester LIKE '%Semester 2%' THEN 'Semester 2'
            WHEN semester LIKE '%Special%1%' THEN 'Special Term 1'
            WHEN semester LIKE '%Special%2%' THEN 'Special Term 2'
            WHEN semester LIKE '%Summer%' THEN 'Summer Session'
            WHEN semester LIKE '%Winter%' THEN 'Winter Session'
            ELSE semester
        END
    """
    )


def downgrade() -> None:
    """
    Downgrade: restore semester to old format.

    Note: This is a lossy operation - we can't restore the original AY year values.
    """
    # Best effort to restore old format
    op.execute(
        """
        UPDATE reviews
        SET semester = CASE
            WHEN semester = 'Semester 1' THEN 'AY2024/25 Sem 1'
            WHEN semester = 'Semester 2' THEN 'AY2023/24 Sem 2'
            WHEN semester = 'Special Term 1' THEN 'AY2024/25 Special Term 1'
            WHEN semester = 'Special Term 2' THEN 'AY2024/25 Special Term 2'
            WHEN semester = 'Summer Session' THEN 'Summer Session'
            WHEN semester = 'Winter Session' THEN 'Winter Session'
            ELSE semester
        END
    """
    )
