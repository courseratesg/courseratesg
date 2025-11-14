#!/usr/bin/env python3
"""Seed database with sample data for testing and development."""

import sys
from datetime import UTC, datetime
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
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

            # Clear existing data and reset ID sequences
            print("🗑️  Clearing existing data...")
            # Use TRUNCATE with RESTART IDENTITY to reset auto-increment IDs
            # CASCADE ensures dependent rows are also deleted
            session.execute(text("TRUNCATE TABLE reviews, courses, professors, universities RESTART IDENTITY CASCADE"))
            session.commit()
            print("✅ Existing data cleared and IDs reset")

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
        now = datetime.now(UTC)
        reviews = [
            # CS101 - NUS reviews
            Review(
                overall_rating=5,
                difficulty_rating=2,
                workload_rating=3,
                comment="Great intro to programming. Dr. Johnson explains topics clearly and makes learning fun!",
                semester="Semester 1",
                year=2024,
                course_code="CS101",
                course_name="Introduction to Computer Science",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=4,
                difficulty_rating=3,
                workload_rating=3,
                comment="Perfect for beginners. Fair assignments that reinforce the material. Highly recommended!",
                semester="Semester 1",
                year=2024,
                course_code="CS101",
                course_name="Introduction to Computer Science",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=4,
                difficulty_rating=2,
                workload_rating=2,
                comment="Well-structured course with clear learning objectives. Dr. Johnson is very supportive.",
                semester="Semester 2",
                year=2024,
                course_code="CS101",
                course_name="Introduction to Computer Science",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=3,
                difficulty_rating=3,
                workload_rating=4,
                comment="Good content but the pace can be a bit slow at times. Workload is heavier than expected.",
                semester="Semester 1",
                year=2023,
                course_code="CS101",
                course_name="Introduction to Computer Science",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
            # CS201 - NTU reviews
            Review(
                overall_rating=5,
                difficulty_rating=4,
                workload_rating=4,
                comment="Challenging but rewarding. Prof. Chen is knowledgeable and passionate about the subject.",
                semester="Semester 1",
                year=2024,
                course_code="CS201",
                course_name="Data Structures and Algorithms",
                university_name="NTU",
                professor_name="Prof. Michael Chen",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=4,
                difficulty_rating=5,
                workload_rating=5,
                comment="Very demanding but you learn a lot. Be prepared to put in the hours. Weekly sets are tough.",
                semester="Semester 1",
                year=2024,
                course_code="CS201",
                course_name="Data Structures and Algorithms",
                university_name="NTU",
                professor_name="Prof. Michael Chen",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=3,
                difficulty_rating=4,
                workload_rating=4,
                comment="The professor moves quite fast. Would be helpful to have more office hours for clarification.",
                semester="Semester 2",
                year=2024,
                course_code="CS201",
                course_name="Data Structures and Algorithms",
                university_name="NTU",
                professor_name="Prof. Michael Chen",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=5,
                difficulty_rating=4,
                workload_rating=3,
                comment="Excellent course! The coding assignments really help solidify understanding of the concepts.",
                semester="Semester 1",
                year=2023,
                course_code="CS201",
                course_name="Data Structures and Algorithms",
                university_name="NTU",
                professor_name="Prof. Michael Chen",
                created_at=now,
                updated_at=now,
            ),
            # MATH220 - SMU reviews
            Review(
                overall_rating=4,
                difficulty_rating=3,
                workload_rating=3,
                comment="Dr. Rodriguez makes calculus approachable. Good balance of theory and application.",
                semester="Semester 1",
                year=2024,
                course_code="MATH220",
                course_name="Calculus II",
                university_name="SMU",
                professor_name="Dr. Emily Rodriguez",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=3,
                difficulty_rating=4,
                workload_rating=4,
                comment="Content is dense and moves quickly. Make sure you keep up with the homework.",
                semester="Semester 1",
                year=2024,
                course_code="MATH220",
                course_name="Calculus II",
                university_name="SMU",
                professor_name="Dr. Emily Rodriguez",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=5,
                difficulty_rating=3,
                workload_rating=2,
                comment="Best math professor I've had! Very clear explanations and helpful during office hours.",
                semester="Semester 2",
                year=2024,
                course_code="MATH220",
                course_name="Calculus II",
                university_name="SMU",
                professor_name="Dr. Emily Rodriguez",
                created_at=now,
                updated_at=now,
            ),
            # PHYS101 - NUS reviews
            Review(
                overall_rating=4,
                difficulty_rating=3,
                workload_rating=3,
                comment="Engaging lectures with lots of demonstrations. Lab sessions are well-organized.",
                semester="Semester 1",
                year=2024,
                course_code="PHYS101",
                course_name="General Physics I",
                university_name="NUS",
                professor_name="Dr. Robert Kim",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=3,
                difficulty_rating=4,
                workload_rating=4,
                comment="Lab reports take a lot of time. Make sure you understand the concepts before the lab.",
                semester="Semester 1",
                year=2024,
                course_code="PHYS101",
                course_name="General Physics I",
                university_name="NUS",
                professor_name="Dr. Robert Kim",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=5,
                difficulty_rating=2,
                workload_rating=3,
                comment="Dr. Kim is fantastic! He really cares about student learning and is always available to help.",
                semester="Semester 2",
                year=2024,
                course_code="PHYS101",
                course_name="General Physics I",
                university_name="NUS",
                professor_name="Dr. Robert Kim",
                created_at=now,
                updated_at=now,
            ),
            # Some reviews with mixed ratings
            Review(
                overall_rating=2,
                difficulty_rating=5,
                workload_rating=5,
                comment="Extremely difficult. Exams way harder than homework. Felt unprepared despite studying.",
                semester="Semester 1",
                year=2023,
                course_code="CS201",
                course_name="Data Structures and Algorithms",
                university_name="NTU",
                professor_name="Prof. Michael Chen",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=5,
                difficulty_rating=1,
                workload_rating=1,
                comment="Easy A if you have prior programming experience. Great for building confidence!",
                semester="Semester 1",
                year=2023,
                course_code="CS101",
                course_name="Introduction to Computer Science",
                university_name="NUS",
                professor_name="Dr. Sarah Johnson",
                created_at=now,
                updated_at=now,
            ),
            Review(
                overall_rating=1,
                difficulty_rating=5,
                workload_rating=5,
                comment="Too much work for the credits. Grading seems arbitrary and professor is hard to reach.",
                semester="Semester 1",
                year=2023,
                course_code="MATH220",
                course_name="Calculus II",
                university_name="SMU",
                professor_name="Dr. Emily Rodriguez",
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
