// API Service for Backend Endpoints
// Uses mock data for development - replace with actual API calls when backend is ready

import type { Review } from '../App';
import { mockReviews, mockUniversities, mockProfessors, mockCourses, SEMESTER_OPTIONS } from '../components/mockData';

// Re-export SEMESTER_OPTIONS so components don't need to import directly from mockData
export { SEMESTER_OPTIONS };

const API_BASE_URL = '/api/v1';
const MOCK_DELAY = 300; // Simulate network delay

// Convert mock data from JSON-like format (with ISO string dates) to Review objects (with Date objects)
const getMockReviewsAsReviews = (): Review[] => {
  return mockReviews.map(review => ({
    ...review,
    createdAt: new Date(review.createdAt as string)
  }));
};

// Types
export interface Professor {
  name: string;
}

export interface Course {
  code: string;
  name: string;
  university: string;
}

export interface University {
  name: string;
}

export interface ProfessorStats {
  averageTeaching: number;
  averageDifficulty: number;
  averageWorkload?: number;
  totalReviews: number;
}

export interface CourseStats {
  averageDifficulty: number;
  averageWorkload: number;
  averageTeaching?: number;
  totalReviews: number;
}

export interface CreateReviewPayload {
  courseCode: string;
  courseName: string;
  yearTaken: string;
  semester?: string;
  professorName: string;
  universityName: string;
  teachingRating: number;
  difficultyRating: number;
  workloadRating: number;
  reviewText: string;
  gradeReceived?: string;
  gradeExpected?: string;
}

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get all reviews (from mock data + localStorage)
const getAllReviews = (): Review[] => {
  const savedReviews = localStorage.getItem('userReviews');
  if (savedReviews) {
    const parsedReviews = JSON.parse(savedReviews);
    return [...getMockReviewsAsReviews(), ...parsedReviews.map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }))];
  }
  return getMockReviewsAsReviews();
};

// Helper to save reviews to localStorage
const saveReview = (review: Review): void => {
  const savedReviews = localStorage.getItem('userReviews');
  const userReviews = savedReviews ? JSON.parse(savedReviews) : [];
  userReviews.push(review);
  localStorage.setItem('userReviews', JSON.stringify(userReviews));
};

const updateReviewInStorage = (reviewId: string, updatedReview: Partial<Review>): void => {
  const savedReviews = localStorage.getItem('userReviews');
  if (!savedReviews) return;
  
  const userReviews = JSON.parse(savedReviews);
  const index = userReviews.findIndex((r: Review) => r.id === reviewId);
  
  if (index !== -1) {
    userReviews[index] = { ...userReviews[index], ...updatedReview };
    localStorage.setItem('userReviews', JSON.stringify(userReviews));
  }
};

const deleteReviewFromStorage = (reviewId: string): void => {
  const savedReviews = localStorage.getItem('userReviews');
  if (!savedReviews) return;
  
  const userReviews = JSON.parse(savedReviews);
  const filteredReviews = userReviews.filter((r: Review) => r.id !== reviewId);
  localStorage.setItem('userReviews', JSON.stringify(filteredReviews));
};

// ==================== SEARCH & BROWSE ENDPOINTS ====================

/**
 * GET /api/v1/search/professors?q={query}
 * Fuzzy search professors by name
 */
export async function searchProfessors(query: string): Promise<string[]> {
  await delay(MOCK_DELAY);
  
  const lowerQuery = query.toLowerCase();
  return mockProfessors.filter(professor => 
    professor.toLowerCase().includes(lowerQuery)
  );
}

/**
 * GET /api/v1/search/courses?q={query}
 * Search courses by code (exact match)
 */
export async function searchCourses(query: string): Promise<Course[]> {
  await delay(MOCK_DELAY);
  
  const upperQuery = query.toUpperCase();
  const courses = new Map<string, Course>();
  
  mockCourses.forEach(course => {
    if (course.code.toUpperCase() === upperQuery) {
      const key = `${course.code}-${course.university}`;
      if (!courses.has(key)) {
        courses.set(key, {
          code: course.code,
          name: course.name,
          university: course.university
        });
      }
    }
  });
  
  return Array.from(courses.values());
}

/**
 * GET /api/v1/professors
 * List all professors (for dropdowns)
 */
export async function getProfessors(): Promise<string[]> {
  await delay(MOCK_DELAY);
  
  const allReviews = getAllReviews();
  const professors = new Set<string>();
  
  allReviews.forEach(review => {
    professors.add(review.professorName);
  });
  
  return Array.from(professors).sort();
}

/**
 * GET /api/v1/universities
 * List all universities (for dropdowns)
 */
export async function getUniversities(): Promise<string[]> {
  await delay(MOCK_DELAY);
  
  // Return mock universities data
  return [...mockUniversities].sort();
}

/**
 * GET /api/v1/courses
 * List all course codes (for dropdowns)
 */
export async function getCourses(): Promise<string[]> {
  await delay(MOCK_DELAY);
  
  const allReviews = getAllReviews();
  const courseCodes = new Set<string>();
  
  allReviews.forEach(review => {
    courseCodes.add(review.courseCode);
  });
  
  return Array.from(courseCodes).sort();
}

// ==================== REVIEWS & STATISTICS ENDPOINTS ====================

/**
 * GET /api/v1/reviews?professor={name}
 * Get reviews by professor name
 */
export async function getReviewsByProfessor(professorName: string): Promise<Review[]> {
  await delay(MOCK_DELAY);
  
  const allReviews = getAllReviews();
  return allReviews.filter(review => 
    review.professorName.toLowerCase() === professorName.toLowerCase()
  );
}

/**
 * GET /api/v1/reviews?course={code}&university={uni}
 * Get reviews by course + university
 */
export async function getReviewsByCourse(courseCode: string, university: string): Promise<Review[]> {
  await delay(MOCK_DELAY);
  
  const allReviews = getAllReviews();
  return allReviews.filter(review => 
    review.courseCode.toLowerCase() === courseCode.toLowerCase() &&
    review.universityName.toLowerCase() === university.toLowerCase()
  );
}

/**
 * GET /api/v1/stats/professor?name={name}
 * Professor stats (avg ratings, count)
 */
export async function getProfessorStats(name: string): Promise<ProfessorStats> {
  await delay(MOCK_DELAY);
  
  const reviews = await getReviewsByProfessor(name);
  if (reviews.length === 0) {
    return {
      averageTeaching: 0,
      averageDifficulty: 0,
      averageWorkload: 0,
      totalReviews: 0
    };
  }
  
  const totalTeaching = reviews.reduce((sum, review) => sum + review.teachingRating, 0);
  const totalDifficulty = reviews.reduce((sum, review) => sum + review.difficultyRating, 0);
  const totalWorkload = reviews.reduce((sum, review) => sum + review.workloadRating, 0);
  
  return {
    averageTeaching: totalTeaching / reviews.length,
    averageDifficulty: totalDifficulty / reviews.length,
    averageWorkload: totalWorkload / reviews.length,
    totalReviews: reviews.length
  };
}

/**
 * GET /api/v1/stats/course?code={code}&university={uni}
 * Course stats (avg ratings, count)
 */
export async function getCourseStats(courseCode: string, university: string): Promise<CourseStats> {
  await delay(MOCK_DELAY);
  
  const reviews = await getReviewsByCourse(courseCode, university);
  if (reviews.length === 0) {
    return {
      averageDifficulty: 0,
      averageWorkload: 0,
      averageTeaching: 0,
      totalReviews: 0
    };
  }
  
  const totalDifficulty = reviews.reduce((sum, review) => sum + review.difficultyRating, 0);
  const totalWorkload = reviews.reduce((sum, review) => sum + review.workloadRating, 0);
  const totalTeaching = reviews.reduce((sum, review) => sum + review.teachingRating, 0);
  
  return {
    averageDifficulty: totalDifficulty / reviews.length,
    averageWorkload: totalWorkload / reviews.length,
    averageTeaching: totalTeaching / reviews.length,
    totalReviews: reviews.length
  };
}

// ==================== REVIEW MANAGEMENT (PROTECTED) ====================

/**
 * POST /api/v1/reviews
 * Submit new review
 */
export async function createReview(payload: CreateReviewPayload, userId: string): Promise<Review> {
  await delay(MOCK_DELAY);
  
  const newReview: Review = {
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    courseCode: payload.courseCode.trim().toUpperCase(),
    courseName: payload.courseName.trim(),
    yearTaken: payload.yearTaken,
    semester: payload.semester,
    professorName: payload.professorName.trim(),
    universityName: payload.universityName.trim(),
    teachingRating: payload.teachingRating,
    difficultyRating: payload.difficultyRating,
    workloadRating: payload.workloadRating,
    reviewText: payload.reviewText.trim(),
    gradeReceived: payload.gradeReceived,
    gradeExpected: payload.gradeExpected,
    createdAt: new Date()
  };
  
  saveReview(newReview);
  return newReview;
}

/**
 * GET /api/v1/reviews/mine
 * User's own reviews
 */
export async function getMyReviews(userId: string): Promise<Review[]> {
  await delay(MOCK_DELAY);
  
  const allReviews = getAllReviews();
  return allReviews.filter(review => review.userId === userId);
}

/**
 * PUT /api/v1/reviews/{id}
 * Edit own review
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<CreateReviewPayload>
): Promise<Review> {
  await delay(MOCK_DELAY);
  
  const savedReviews = localStorage.getItem('userReviews');
  if (!savedReviews) {
    throw new Error('Review not found');
  }
  
  const userReviews = JSON.parse(savedReviews);
  const index = userReviews.findIndex((r: Review) => r.id === reviewId);
  
  if (index === -1) {
    throw new Error('Review not found');
  }
  
  const updatedReview = {
    ...userReviews[index],
    ...(updates.courseCode && { courseCode: updates.courseCode.trim().toUpperCase() }),
    ...(updates.courseName && { courseName: updates.courseName.trim() }),
    ...(updates.yearTaken && { yearTaken: updates.yearTaken }),
    ...(updates.semester !== undefined && { semester: updates.semester }),
    ...(updates.professorName && { professorName: updates.professorName.trim() }),
    ...(updates.universityName && { universityName: updates.universityName.trim() }),
    ...(updates.teachingRating && { teachingRating: updates.teachingRating }),
    ...(updates.difficultyRating && { difficultyRating: updates.difficultyRating }),
    ...(updates.workloadRating && { workloadRating: updates.workloadRating }),
    ...(updates.reviewText && { reviewText: updates.reviewText.trim() }),
    ...(updates.gradeReceived !== undefined && { gradeReceived: updates.gradeReceived }),
    ...(updates.gradeExpected !== undefined && { gradeExpected: updates.gradeExpected })
  };
  
  userReviews[index] = updatedReview;
  localStorage.setItem('userReviews', JSON.stringify(userReviews));
  
  return {
    ...updatedReview,
    createdAt: new Date(updatedReview.createdAt)
  };
}

/**
 * DELETE /api/v1/reviews/{id}
 * Delete own review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  await delay(MOCK_DELAY);
  deleteReviewFromStorage(reviewId);
}

// Export a helper to check authentication (for protected endpoints)
export function getAuthToken(): string | null {
  return localStorage.getItem('amplifySession') || null;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate academic year options for dropdowns
 * Returns academic years from 10 years ago to 2 years in the future
 */
export function generateAcademicYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const academicYears: string[] = [];
  
  // Generate academic years from 10 years ago to 2 years in the future
  for (let i = 10; i >= -2; i--) {
    const startYear = currentYear - i;
    const endYear = startYear + 1;
    academicYears.push(`AY${startYear}/${endYear}`);
  }
  
  return academicYears;
}

/**
 * Get current academic year based on the current date
 * Academic year typically starts in August/September
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based, January = 0
  
  // Academic year typically starts in August/September
  // If current month is before August (month 7), we're still in the previous academic year
  if (currentMonth < 7) {
    return `AY${currentYear - 1}/${currentYear}`;
  } else {
    return `AY${currentYear}/${currentYear + 1}`;
  }
}

