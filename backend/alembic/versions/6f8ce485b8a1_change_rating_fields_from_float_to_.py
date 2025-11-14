"""Change rating fields from float to integer

Revision ID: 6f8ce485b8a1
Revises: f46d02669629
Create Date: 2025-11-15 00:06:09.860468

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6f8ce485b8a1"
down_revision: str | Sequence[str] | None = "f46d02669629"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """
    Change rating fields from float to integer.

    Ratings are rounded to nearest integer during conversion.
    """
    # Convert float to integer using ROUND for proper rounding
    op.alter_column(
        "reviews",
        "overall_rating",
        existing_type=sa.DOUBLE_PRECISION(precision=53),
        type_=sa.Integer(),
        existing_nullable=False,
        postgresql_using="ROUND(overall_rating)::integer",
    )
    op.alter_column(
        "reviews",
        "difficulty_rating",
        existing_type=sa.DOUBLE_PRECISION(precision=53),
        type_=sa.Integer(),
        existing_nullable=False,
        postgresql_using="ROUND(difficulty_rating)::integer",
    )
    op.alter_column(
        "reviews",
        "workload_rating",
        existing_type=sa.DOUBLE_PRECISION(precision=53),
        type_=sa.Integer(),
        existing_nullable=False,
        postgresql_using="ROUND(workload_rating)::integer",
    )


def downgrade() -> None:
    """
    Downgrade: change rating fields back to float.

    Note: This is a lossy operation - decimal precision is lost.
    """
    op.alter_column(
        "reviews",
        "workload_rating",
        existing_type=sa.Integer(),
        type_=sa.DOUBLE_PRECISION(precision=53),
        existing_nullable=False,
    )
    op.alter_column(
        "reviews",
        "difficulty_rating",
        existing_type=sa.Integer(),
        type_=sa.DOUBLE_PRECISION(precision=53),
        existing_nullable=False,
    )
    op.alter_column(
        "reviews",
        "overall_rating",
        existing_type=sa.Integer(),
        type_=sa.DOUBLE_PRECISION(precision=53),
        existing_nullable=False,
    )
