#!/usr/bin/env python3
"""Seed database with sample data for testing and development."""

import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.exc import IntegrityError

from app.infrastructure.rds_client import RDSClient
from app.models.course import Course
from app.models.professor import Professor
from app.models.review import Review
from app.models.university import University
from app.settings.rds_settings import RDSSettings


def seed_database():
    """Seed database with sample data."""
    print("🌱 Starting database seeding...")

    # Initialize RDS client
    settings = RDSSettings()  # type: ignore[call-arg]
    client = RDSClient(settings)
    client.initialize()

    # Create session
    session = client.create_session()

    try:
        # Check if data already exists
        existing_universities = session.query(University).count()
        if existing_universities > 0:
            print(f"⚠️  Database already contains {existing_universities} universities")
            response = input("Clear existing data and reseed? (y/N): ")
            if response.lower() != "y":
                print("❌ Seeding cancelled")
                return

            # Clear existing data
            print("🗑️  Clearing existing data...")
            session.query(Review).delete()
            session.query(Course).delete()
            session.query(Professor).delete()
            session.query(University).delete()
            session.commit()
            print("✅ Existing data cleared")

        # Create sample universities
        print("\n📚 Creating universities...")
        nus = University(name="NUS", review_count=0)
        ntu = University(name="NTU", review_count=0)
        smu = University(name="SMU", review_count=0)
        session.add_all([nus, ntu, smu])
        session.flush()  # Get IDs
        print(f"✅ Created 3 universities: NUS (ID: {nus.id}), NTU (ID: {ntu.id}), SMU (ID: {smu.id})")

        # Create sample professors
        print("\n👨‍🏫 Creating professors...")
        professors = [
            Professor(
                name="Dr. Sarah Johnson",
                university_id=nus.id,
                university="NUS",
                review_count=0,
            ),
            Professor(
                name="Prof. Michael Chen",
                university_id=ntu.id,
                university="NTU",
                review_count=0,
            ),
            Professor(
                name="Dr. Emily Rodriguez",
                university_id=smu.id,
                university="SMU",
                review_count=0,
            ),
            Professor(
                name="Dr. Robert Kim",
                university_id=nus.id,
                university="NUS",
                review_count=0,
            ),
        ]
        session.add_all(professors)
        session.flush()
        print(f"✅ Created {len(professors)} professors")

        # Create sample courses
        print("\n📖 Creating courses...")
        courses = [
            Course(
                code="CS101",
                name="Introduction to Computer Science",
                university_id=nus.id,
                university="NUS",
                review_count=0,
            ),
            Course(
                code="CS201",
                name="Data Structures and Algorithms",
                university_id=ntu.id,
                university="NTU",
                review_count=0,
            ),
            Course(
                code="MATH220",
                name="Calculus II",
                university_id=smu.id,
                university="SMU",
                review_count=0,
            ),
            Course(
                code="PHYS101",
                name="General Physics I",
                university_id=nus.id,
                university="NUS",
                review_count=0,
            ),
        ]
        session.add_all(courses)
        session.flush()
        print(f"✅ Created {len(courses)} courses")

        # Create sample reviews
        print("\n⭐ Creating reviews...")
        now = datetime.utcnow()
        reviews = [
            Review(
                overall_rating=4.5,
                difficulty_rating=3.0,
                workload_rating=3.5,
                comment="Great introduction to programming concepts. Dr. Johnson explains complex topics clearly.",
                semester="AY2023/24 Sem 1",
                year=2023,
                course_code="CS101",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=3.8,
                difficulty_rating=4.2,
                workload_rating=4.0,
                comment="Challenging course but very rewarding. The professor is knowledgeable but moves fast.",
                semester="AY2023/24 Sem 2",
                year=2023,
                course_code="CS201",
                university_name="NTU",
                professor_name="Prof. Michael Chen",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=4.2,
                difficulty_rating=2.8,
                workload_rating=3.2,
                comment="Perfect for beginners. Assignments are fair and help reinforce the material.",
                semester="AY2023/24 Sem 1",
                year=2023,
                course_code="CS101",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=3.5,
                difficulty_rating=3.2,
                workload_rating=3.0,
                comment="Solid introduction with practical examples. Workload is manageable.",
                semester="AY2023/24 Sem 1",
                year=2023,
                course_code="CS101",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
        ]
        session.add_all(reviews)
        session.flush()
        print(f"✅ Created {len(reviews)} reviews")

        # Commit all changes
        session.commit()
        print("\n✅ Database seeding completed successfully!")
        print("\n📊 Summary:")
        print(f"   • Universities: {session.query(University).count()}")
        print(f"   • Professors: {session.query(Professor).count()}")
        print(f"   • Courses: {session.query(Course).count()}")
        print(f"   • Reviews: {session.query(Review).count()}")

    except IntegrityError as e:
        session.rollback()
        print(f"\n❌ Database integrity error: {e}")
        print("   This might happen if data already exists. Try clearing the database first.")
        sys.exit(1)

    except Exception as e:
        session.rollback()
        print(f"\n❌ Error seeding database: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)

    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
