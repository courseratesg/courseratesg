// API Service for Backend Endpoints
// Supports both mock data and real API calls via environment variable

import type { Review } from '../App';
import { mockReviews, mockUniversities, mockProfessors, mockCourses, SEMESTER_OPTIONS } from '../components/mockData';

// Re-export SEMESTER_OPTIONS so components don't need to import directly from mockData
export { SEMESTER_OPTIONS };

// Configuration: Use mock data by default, set VITE_USE_MOCK_API=false to use real API
const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? 'true') !== 'false'; // Defaults to true
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const MOCK_DELAY = 300; // Simulate network delay

// Helper to get authentication token (defined here to avoid circular dependency)
async function getAuthTokenForRequest(): Promise<string | null> {
  try {
    const { authService } = await import('./auth-service');
    return await authService.getAuthToken();
  } catch {
    return null;
  }
}

// Helper to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getAuthTokenForRequest();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}

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
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const lowerQuery = query.toLowerCase();
    return mockProfessors.filter(professor => 
      professor.toLowerCase().includes(lowerQuery)
    );
  }
  
  return apiRequest<string[]>(`/search/professors?q=${encodeURIComponent(query)}`);
}

/**
 * GET /api/v1/search/courses?q={query}
 * Search courses by code (exact match)
 */
export async function searchCourses(query: string): Promise<Course[]> {
  if (USE_MOCK_API) {
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
  
  return apiRequest<Course[]>(`/search/courses?q=${encodeURIComponent(query)}`);
}

/**
 * GET /api/v1/professors
 * List all professors (for dropdowns)
 */
export async function getProfessors(): Promise<string[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const allReviews = getAllReviews();
    const professors = new Set<string>();
    
    allReviews.forEach(review => {
      professors.add(review.professorName);
    });
    
    return Array.from(professors).sort();
  }
  
  return apiRequest<string[]>('/professors');
}

/**
 * GET /api/v1/universities
 * List all universities (for dropdowns)
 */
export async function getUniversities(): Promise<string[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return [...mockUniversities].sort();
  }
  
  return apiRequest<string[]>('/universities');
}

/**
 * GET /api/v1/courses
 * List all course codes (for dropdowns)
 */
export async function getCourses(): Promise<string[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const allReviews = getAllReviews();
    const courseCodes = new Set<string>();
    
    allReviews.forEach(review => {
      courseCodes.add(review.courseCode);
    });
    
    return Array.from(courseCodes).sort();
  }
  
  return apiRequest<string[]>('/courses');
}

// ==================== REVIEWS & STATISTICS ENDPOINTS ====================

/**
 * GET /api/v1/reviews?professor={name}
 * Get reviews by professor name
 */
export async function getReviewsByProfessor(professorName: string): Promise<Review[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const allReviews = getAllReviews();
    return allReviews.filter(review => 
      review.professorName.toLowerCase() === professorName.toLowerCase()
    );
  }
  
  const reviews = await apiRequest<Review[]>(`/reviews?professor=${encodeURIComponent(professorName)}`);
  // Convert date strings to Date objects
  return reviews.map(review => ({
    ...review,
    createdAt: new Date(review.createdAt)
  }));
}

/**
 * GET /api/v1/reviews?course={code}&university={uni}
 * Get reviews by course + university
 */
export async function getReviewsByCourse(courseCode: string, university: string): Promise<Review[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const allReviews = getAllReviews();
    return allReviews.filter(review => 
      review.courseCode.toLowerCase() === courseCode.toLowerCase() &&
      review.universityName.toLowerCase() === university.toLowerCase()
    );
  }
  
  const reviews = await apiRequest<Review[]>(
    `/reviews?course=${encodeURIComponent(courseCode)}&university=${encodeURIComponent(university)}`
  );
  // Convert date strings to Date objects
  return reviews.map(review => ({
    ...review,
    createdAt: new Date(review.createdAt)
  }));
}

/**
 * GET /api/v1/stats/professor?name={name}
 * Professor stats (avg ratings, count)
 */
export async function getProfessorStats(name: string): Promise<ProfessorStats> {
  if (USE_MOCK_API) {
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
  
  return apiRequest<ProfessorStats>(`/stats/professor?name=${encodeURIComponent(name)}`);
}

/**
 * GET /api/v1/stats/course?code={code}&university={uni}
 * Course stats (avg ratings, count)
 */
export async function getCourseStats(courseCode: string, university: string): Promise<CourseStats> {
  if (USE_MOCK_API) {
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
  
  return apiRequest<CourseStats>(
    `/stats/course?code=${encodeURIComponent(courseCode)}&university=${encodeURIComponent(university)}`
  );
}

// ==================== REVIEW MANAGEMENT (PROTECTED) ====================

/**
 * POST /api/v1/reviews
 * Submit new review
 */
export async function createReview(payload: CreateReviewPayload, userId: string): Promise<Review> {
  if (USE_MOCK_API) {
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
  
  const review = await apiRequest<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  // Convert date string to Date object
  return {
    ...review,
    createdAt: new Date(review.createdAt)
  };
}

/**
 * GET /api/v1/reviews/mine
 * User's own reviews
 */
export async function getMyReviews(userId: string): Promise<Review[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const allReviews = getAllReviews();
    return allReviews.filter(review => review.userId === userId);
  }
  
  const reviews = await apiRequest<Review[]>('/reviews/mine');
  // Convert date strings to Date objects
  return reviews.map(review => ({
    ...review,
    createdAt: new Date(review.createdAt)
  }));
}

/**
 * PUT /api/v1/reviews/{id}
 * Edit own review
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<CreateReviewPayload>
): Promise<Review> {
  if (USE_MOCK_API) {
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
  
  const review = await apiRequest<Review>(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  
  // Convert date string to Date object
  return {
    ...review,
    createdAt: new Date(review.createdAt)
  };
}

/**
 * DELETE /api/v1/reviews/{id}
 * Delete own review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    deleteReviewFromStorage(reviewId);
    return;
  }
  
  await apiRequest<void>(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}

// Export a helper to get authentication token (for protected endpoints)
// This will be used when making actual API calls
export async function getAuthToken(): Promise<string | null> {
  // Import dynamically to avoid circular dependencies
  const { authService } = await import('./auth-service');
  return await authService.getAuthToken();
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

