// API Service for Backend Endpoints
// Supports both mock data and real API calls via environment variable

import type { Review } from '../App';
import { mockReviews, mockUniversities, mockProfessors, mockCourses, SEMESTER_OPTIONS } from '../components/mockData';
import type { components } from '../types/api';

// Re-export SEMESTER_OPTIONS so components don't need to import directly from mockData
export { SEMESTER_OPTIONS };

// Configuration: Use mock data by default, set VITE_USE_MOCK_API=false to use real API
const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? 'true') !== 'false'; // Defaults to true
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.courseratesg.xyz/api/v1';
const MOCK_DELAY = 300; // Simulate network delay

// ==================== API SCHEMA TYPES ====================

type ApiReview = components['schemas']['Review'];
type ApiReviewCreate = components['schemas']['ReviewCreate'];
type ApiReviewUpdate = components['schemas']['ReviewUpdate'];
type ApiProfessor = components['schemas']['Professor'];
type ApiCourse = components['schemas']['Course'];
type ApiUniversity = components['schemas']['University'];
type ApiReviewStats = {
  average_overall_rating?: number | null;
  average_difficulty_rating?: number | null;
  average_workload_rating?: number | null;
  review_count?: number | null;
};

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

  const { headers: optionHeaders, ...restOptions } = options;
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (optionHeaders) {
    const overrideHeaders = new Headers(optionHeaders);
    overrideHeaders.forEach((value, key) => headers.set(key, value));
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

// Helper to build query strings safely
function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function mapApiReviewToReview(apiReview: ApiReview): Review {
  return {
    id: apiReview.id.toString(),
    userId: '', // Not provided by API
    courseCode: apiReview.course_code,
    yearTaken: apiReview.year ? `AY${apiReview.year}/${apiReview.year + 1}` : '',
    semester: apiReview.semester,
    professorName: apiReview.professor_name ?? '',
    universityName: apiReview.university,
    overallRating: apiReview.overall_rating,
    difficultyRating: apiReview.difficulty_rating,
    workloadRating: apiReview.workload_rating,
    reviewText: apiReview.comment ?? '',
    gradeReceived: undefined,
    gradeExpected: undefined,
    createdAt: new Date(apiReview.created_at),
  };
}

function pickStatValue(stats: unknown, keys: string[]): number | undefined {
  if (!stats || typeof stats !== 'object') {
    return undefined;
  }

  for (const key of keys) {
    if (key in stats) {
      const value = (stats as Record<string, unknown>)[key];
      if (typeof value === 'number') {
        return value;
      }
      if (value !== null && value !== undefined) {
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
          return numeric;
        }
      }
    }
  }

  return undefined;
}

function mapStatsResponseToProfessorStats(stats: ApiReviewStats | null | undefined): ProfessorStats {
  const averageOverall =
    pickStatValue(stats, [
      'average_overall_rating',
      'avg_overall_rating',
      'averageTeaching',
      'average_overall',
      'avg_overall',
    ]) ?? 0;
  const averageDifficulty =
    pickStatValue(stats, [
      'average_difficulty_rating',
      'avg_difficulty_rating',
      'averageDifficulty',
      'average_difficulty',
      'avg_difficulty',
    ]) ?? 0;
  const averageWorkload =
    pickStatValue(stats, [
      'average_workload_rating',
      'avg_workload_rating',
      'average_workload',
      'avg_workload',
      'averageWorkload',
    ]) ?? 0;
  const totalReviews =
    pickStatValue(stats, ['review_count', 'total_reviews', 'totalReviews']) ?? 0;

  return {
    averageOverall,
    averageDifficulty,
    averageWorkload,
    totalReviews,
  };
}

function mapStatsResponseToCourseStats(stats: ApiReviewStats | null | undefined): CourseStats {
  const averageDifficulty =
    pickStatValue(stats, [
      'average_difficulty_rating',
      'avg_difficulty_rating',
      'average_difficulty',
      'avg_difficulty',
      'averageDifficulty',
    ]) ?? 0;
  const averageWorkload =
    pickStatValue(stats, [
      'average_workload_rating',
      'avg_workload_rating',
      'average_workload',
      'avg_workload',
      'averageWorkload',
    ]) ?? 0;
  const averageOverall =
    pickStatValue(stats, [
      'average_overall_rating',
      'avg_overall_rating',
      'average_overall',
      'avg_overall',
      'averageTeaching',
    ]) ?? 0;
  const totalReviews =
    pickStatValue(stats, ['review_count', 'total_reviews', 'totalReviews']) ?? 0;

  return {
    averageDifficulty,
    averageWorkload,
    averageOverall,
    totalReviews,
  };
}

function parseAcademicYearToYear(academicYear: string | undefined): number | null {
  if (!academicYear) return null;
  const match = academicYear.match(/AY\s*(\d{4})/i) || academicYear.match(/AY?(\d{4})/i);
  if (match) {
    const year = Number.parseInt(match[1], 10);
    return Number.isNaN(year) ? null : year;
  }
  const numeric = Number.parseInt(academicYear, 10);
  return Number.isNaN(numeric) ? null : numeric;
}

function mapCreatePayloadToApi(payload: CreateReviewPayload): ApiReviewCreate {
  const year = parseAcademicYearToYear(payload.yearTaken);
  return {
    overall_rating: payload.overallRating,
    difficulty_rating: payload.difficultyRating,
    workload_rating: payload.workloadRating,
    comment: payload.reviewText || null,
    semester: payload.semester ?? 'Semester 1',
    year: year ?? new Date().getFullYear(),
    course_code: payload.courseCode.trim().toUpperCase(),
    university: payload.universityName.trim(),
    professor_name: payload.professorName ? payload.professorName.trim() : null,
  };
}

function mapUpdatePayloadToApi(updates: Partial<CreateReviewPayload>): ApiReviewUpdate {
  const apiUpdates: ApiReviewUpdate = {};

  if (updates.overallRating !== undefined) {
    apiUpdates.overall_rating = updates.overallRating;
  }
  if (updates.difficultyRating !== undefined) {
    apiUpdates.difficulty_rating = updates.difficultyRating;
  }
  if (updates.workloadRating !== undefined) {
    apiUpdates.workload_rating = updates.workloadRating;
  }
  if (updates.reviewText !== undefined) {
    apiUpdates.comment = updates.reviewText || null;
  }
  if (updates.semester !== undefined) {
    apiUpdates.semester = updates.semester || null;
  }
  if (updates.yearTaken !== undefined) {
    const year = parseAcademicYearToYear(updates.yearTaken);
    if (year !== null) {
      apiUpdates.year = year;
    }
  }
  if (updates.professorName !== undefined) {
    apiUpdates.professor_name = updates.professorName ? updates.professorName.trim() : null;
  }

  return apiUpdates;
}

function mapApiCourseToCourse(apiCourse: ApiCourse): Course {
  return {
    id: apiCourse.id,
    code: apiCourse.code,
    university: apiCourse.university,
    reviewCount: apiCourse.review_count,
    name: (apiCourse as ApiCourse & { name?: string }).name ?? apiCourse.code,
  };
}

function mapApiProfessorToProfessor(apiProfessor: ApiProfessor): Professor {
  return {
    id: apiProfessor.id,
    name: apiProfessor.name,
    university: apiProfessor.university,
    reviewCount: (apiProfessor as ApiProfessor & { review_count?: number }).review_count ?? 0,
  };
}

function isCourseLike(value: unknown): value is ApiCourse {
  return (
    !!value &&
    typeof value === 'object' &&
    'code' in value &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

function isProfessorLike(value: unknown): value is ApiProfessor {
  return (
    !!value &&
    typeof value === 'object' &&
    'name' in value &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

function extractArrayFromResponse<T>(
  response: unknown,
  guard: (value: unknown) => value is T,
  keyHints: string[]
): T[] {
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === null || current === undefined) {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (Array.isArray(current)) {
      const filtered = current.filter(guard) as T[];
      if (filtered.length > 0) {
        return filtered;
      }
      // Continue scanning nested arrays for guarded values
      current.forEach(item => queue.push(item));
      continue;
    }

    if (typeof current === 'object') {
      const record = current as Record<string, unknown>;

      keyHints.forEach(key => {
        if (key in record) {
          queue.push(record[key]);
        }
      });

      Object.values(record).forEach(value => {
        if (value && typeof value === 'object') {
          queue.push(value);
        }
      });
    }
  }

  return [];
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
  id: number;
  name: string;
  university: string;
  reviewCount: number;
}

export interface Course {
  id: number;
  code: string;
  university: string;
  reviewCount: number;
  name?: string;
}

export interface University {
  id: number;
  name: string;
  reviewCount: number;
}

export interface ProfessorStats {
  averageOverall: number;
  averageDifficulty: number;
  averageWorkload?: number;
  totalReviews: number;
}

export interface CourseStats {
  averageDifficulty: number;
  averageWorkload: number;
  averageOverall?: number;
  totalReviews: number;
}

export interface CreateReviewPayload {
  courseCode: string;
  yearTaken: string;
  semester?: string;
  professorName: string;
  universityName: string;
  overallRating: number;
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
    return [
      ...getMockReviewsAsReviews(),
      ...parsedReviews.map((r: any) => ({
        ...r,
        overallRating: r.overallRating ?? r.teachingRating ?? 0,
        createdAt: new Date(r.createdAt)
      }))
    ];
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

const updateReviewInStorage = (
  reviewId: string,
  updates: Partial<CreateReviewPayload>
): Review | null => {
  const savedReviews = localStorage.getItem('userReviews');
  if (!savedReviews) return null;

  const userReviews = JSON.parse(savedReviews);
  const index = userReviews.findIndex((r: Review) => r.id === reviewId);

  if (index === -1) {
    return null;
  }

  const updatedReview = {
    ...userReviews[index],
    ...(updates.courseCode && { courseCode: updates.courseCode.trim().toUpperCase() }),
    ...(updates.yearTaken && { yearTaken: updates.yearTaken }),
    ...(updates.semester !== undefined && { semester: updates.semester }),
    ...(updates.professorName && { professorName: updates.professorName.trim() }),
    ...(updates.universityName && { universityName: updates.universityName.trim() }),
    ...(updates.overallRating !== undefined && { overallRating: updates.overallRating }),
    ...(updates.difficultyRating !== undefined && { difficultyRating: updates.difficultyRating }),
    ...(updates.workloadRating !== undefined && { workloadRating: updates.workloadRating }),
    ...(updates.reviewText && { reviewText: updates.reviewText.trim() }),
    ...(updates.gradeReceived !== undefined && { gradeReceived: updates.gradeReceived }),
    ...(updates.gradeExpected !== undefined && { gradeExpected: updates.gradeExpected })
  };

  userReviews[index] = updatedReview;
  localStorage.setItem('userReviews', JSON.stringify(userReviews));

  return updatedReview;
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
export async function searchProfessors(query: string): Promise<Professor[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const lowerQuery = query.toLowerCase();

    const reviews = getAllReviews();
    const aggregated = new Map<
      string,
      { university: string; reviewCount: number }
    >();

    reviews.forEach(review => {
      if (review.professorName.toLowerCase().includes(lowerQuery)) {
        const existing = aggregated.get(review.professorName);
        if (existing) {
          existing.reviewCount += 1;
        } else {
          aggregated.set(review.professorName, {
            university: review.universityName,
            reviewCount: 1,
          });
        }
      }
    });

    const results = Array.from(aggregated.entries()).map(([name, data], index) => ({
      id: index + 1,
      name,
      university: data.university,
      reviewCount: data.reviewCount,
    }));

    if (results.length > 0) {
      return results;
    }

    return mockProfessors
      .filter(professor => professor.toLowerCase().includes(lowerQuery))
      .map((professor, index) => ({
        id: index + 1,
        name: professor,
        university: 'Mock University',
        reviewCount: 0,
      }));
  }
  
  const response = await apiRequest<unknown>(
    `/search/global${buildQueryString({ q: query })}`
  );
  const professors = extractArrayFromResponse(
    response,
    isProfessorLike,
    ['professors', 'results', 'data']
  );

  return professors.map(mapApiProfessorToProfessor);
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
    let nextId = 1;
    
    mockCourses.forEach(course => {
      if (course.code.toUpperCase() === upperQuery) {
        const key = `${course.code}-${course.university}`;
        if (!courses.has(key)) {
          courses.set(key, {
            id: nextId++,
            code: course.code,
            name: course.name,
            university: course.university,
            reviewCount: 0,
          });
        }
      }
    });
    
    return Array.from(courses.values());
  }
  
  const response = await apiRequest<unknown>(
    `/search/courses${buildQueryString({ q: query, exact: true })}`
  );

  const coursesArray = extractArrayFromResponse(
    response,
    isCourseLike,
    ['courses', 'results', 'data']
  );

  return coursesArray.map(mapApiCourseToCourse);
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
  
  const professors = await apiRequest<ApiProfessor[]>('/professors/');
  return professors.map(professor => professor.name).sort();
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
  
  const universities = await apiRequest<ApiUniversity[]>('/universities/');
  return universities.map(university => university.name).sort();
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
  
  const response = await apiRequest<unknown>('/courses/');
  const courseArray = extractArrayFromResponse(
    response,
    isCourseLike,
    ['courses', 'results', 'data']
  );

  return courseArray.map(course => course.code).sort();
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
  
  const reviews = await apiRequest<ApiReview[]>(
    `/reviews/${buildQueryString({ professor_name: professorName })}`
  );
  return reviews.map(mapApiReviewToReview);
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
  
  const reviews = await apiRequest<ApiReview[]>(
    `/reviews/${buildQueryString({
      course_code: courseCode,
      university,
    })}`
  );
  return reviews.map(mapApiReviewToReview);
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
        averageOverall: 0,
        averageDifficulty: 0,
        averageWorkload: 0,
        totalReviews: 0
      };
    }
    
    const totalOverall = reviews.reduce((sum, review) => sum + review.overallRating, 0);
    const totalDifficulty = reviews.reduce((sum, review) => sum + review.difficultyRating, 0);
    const totalWorkload = reviews.reduce((sum, review) => sum + review.workloadRating, 0);
    
    return {
      averageOverall: totalOverall / reviews.length,
      averageDifficulty: totalDifficulty / reviews.length,
      averageWorkload: totalWorkload / reviews.length,
      totalReviews: reviews.length
    };
  }
  
  const stats = await apiRequest<ApiReviewStats | null>(
    `/reviews/stats${buildQueryString({ professor_name: name })}`
  );
  return mapStatsResponseToProfessorStats(stats);
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
        averageOverall: 0,
        totalReviews: 0
      };
    }
    
    const totalDifficulty = reviews.reduce((sum, review) => sum + review.difficultyRating, 0);
    const totalWorkload = reviews.reduce((sum, review) => sum + review.workloadRating, 0);
    const totalOverall = reviews.reduce((sum, review) => sum + review.overallRating, 0);
    
    return {
      averageDifficulty: totalDifficulty / reviews.length,
      averageWorkload: totalWorkload / reviews.length,
      averageOverall: totalOverall / reviews.length,
      totalReviews: reviews.length
    };
  }
  
  const stats = await apiRequest<ApiReviewStats | null>(
    `/reviews/stats${buildQueryString({
      course_code: courseCode,
      university,
    })}`
  );
  return mapStatsResponseToCourseStats(stats);
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
      yearTaken: payload.yearTaken,
      semester: payload.semester,
      professorName: payload.professorName.trim(),
      universityName: payload.universityName.trim(),
      overallRating: payload.overallRating,
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
  
  const apiPayload = mapCreatePayloadToApi(payload);
  const review = await apiRequest<ApiReview>('/reviews/', {
    method: 'POST',
    body: JSON.stringify(apiPayload),
  });
  
  return mapApiReviewToReview(review);
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
  
  const reviews = await apiRequest<ApiReview[]>('/reviews/me');
  return reviews.map(mapApiReviewToReview);
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
    const updatedReview = updateReviewInStorage(reviewId, updates);
    if (!updatedReview) {
      throw new Error('Review not found');
    }

    return {
      ...updatedReview,
      createdAt: new Date(updatedReview.createdAt)
    };
  }
  
  const numericReviewId = Number(reviewId);
  if (!Number.isInteger(numericReviewId)) {
    throw new Error('Invalid review ID');
  }

  const apiUpdates = mapUpdatePayloadToApi(updates);

  const review = await apiRequest<ApiReview>(`/reviews/${numericReviewId}`, {
    method: 'PUT',
    body: JSON.stringify(apiUpdates),
  });
  
  return mapApiReviewToReview(review);
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
  
  const numericReviewId = Number(reviewId);
  if (!Number.isInteger(numericReviewId)) {
    throw new Error('Invalid review ID');
  }

  await apiRequest<void>(`/reviews/${numericReviewId}`, {
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

