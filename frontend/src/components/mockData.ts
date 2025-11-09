// Mock reviews data (JSON-like structure)
// Dates are stored as ISO strings to keep this file JSON-serializable
export const mockReviews = [
  {
    id: '1',
    userId: 'user-123',
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    yearTaken: 'AY2023/2024',
    semester: 'Semester 1',
    professorName: 'Dr. Sarah Johnson',
    universityName: 'University of Technology',
    overallRating: 4.5,
    difficultyRating: 3.0,
    workloadRating: 3.5,
    reviewText: 'Great introduction to programming concepts. Dr. Johnson explains complex topics clearly.',
    gradeReceived: 'A-',
    gradeExpected: 'A',
    createdAt: '2023-12-15T00:00:00.000Z'
  },
  {
    id: '2',
    userId: 'user-456',
    courseCode: 'CS201',
    courseName: 'Data Structures and Algorithms',
    yearTaken: 'AY2023/2024',
    semester: 'Semester 2',
    professorName: 'Prof. Michael Chen',
    universityName: 'State University',
    overallRating: 3.8,
    difficultyRating: 4.2,
    workloadRating: 4.0,
    reviewText: 'Challenging course but very rewarding. The professor is knowledgeable but moves fast.',
    gradeReceived: 'B+',
    gradeExpected: 'A-',
    createdAt: '2023-11-20T00:00:00.000Z'
  },
  {
    id: '3',
    userId: 'user-789',
    courseCode: 'CS101',
    courseName: 'Intro to Computer Science',
    yearTaken: 'AY2023/2024',
    semester: 'Special Term 1',
    professorName: 'Dr. Sarah Johnson',
    universityName: 'University of Technology',
    overallRating: 4.2,
    difficultyRating: 2.8,
    workloadRating: 3.2,
    reviewText: 'Perfect for beginners. Assignments are fair and help reinforce the material.',
    gradeExpected: 'B+',
    createdAt: '2023-10-05T00:00:00.000Z'
  },
  {
    id: '4',
    userId: 'user-321',
    courseCode: 'MATH220',
    courseName: 'Calculus II',
    yearTaken: 'AY2022/2023',
    semester: 'Semester 1',
    professorName: 'Dr. Emily Rodriguez',
    universityName: 'City College',
    overallRating: 4.8,
    difficultyRating: 4.5,
    workloadRating: 4.3,
    reviewText: 'Extremely difficult but Dr. Rodriguez is an amazing teacher. Office hours are very helpful.',
    gradeReceived: 'B',
    gradeExpected: 'B+',
    createdAt: '2022-12-10T00:00:00.000Z'
  },
  {
    id: '5',
    userId: 'user-654',
    courseCode: 'CS201',
    courseName: 'Data Structures',
    yearTaken: 'AY2023/2024',
    semester: 'Semester 2',
    professorName: 'Prof. Michael Chen',
    universityName: 'State University',
    overallRating: 4.0,
    difficultyRating: 4.0,
    workloadRating: 3.8,
    reviewText: 'Good course material. Professor could be more engaging during lectures.',
    gradeReceived: 'A-',
    gradeExpected: 'A',
    createdAt: '2023-09-15T00:00:00.000Z'
  },
  {
    id: '6',
    userId: 'user-987',
    courseCode: 'PHYS101',
    courseName: 'General Physics I',
    yearTaken: 'AY2023/2024',
    semester: 'Special Term 2',
    professorName: 'Dr. Robert Kim',
    universityName: 'Technical Institute',
    overallRating: 3.5,
    difficultyRating: 3.8,
    workloadRating: 3.5,
    reviewText: 'Standard physics course. Labs are well organized but lectures can be dry.',
    gradeReceived: 'B+',
    gradeExpected: 'A-',
    createdAt: '2023-08-20T00:00:00.000Z'
  }
] as const;

export const mockUniversities = [
  'City College',
  'National University',
  'State University',
  'Technical Institute',
  'University of Technology',
] as const;

export const mockProfessors = [
  'Dr. Emily Rodriguez',
  'Dr. Robert Kim',
  'Dr. Sarah Johnson',
  'Prof. Michael Chen',
  'Prof. David Lee',
  'Prof. Jennifer Wang',
  'Dr. James Anderson',
] as const;

export const mockCourses = [
  { code: 'CS101', name: 'Introduction to Computer Science', university: 'University of Technology' },
  { code: 'CS101', name: 'Intro to Computer Science', university: 'University of Technology' },
  { code: 'CS201', name: 'Data Structures and Algorithms', university: 'State University' },
  { code: 'CS201', name: 'Data Structures', university: 'State University' },
  { code: 'CS301', name: 'Database Systems', university: 'National University' },
  { code: 'CS302', name: 'Operating Systems', university: 'National University' },
  { code: 'MATH220', name: 'Calculus II', university: 'City College' },
  { code: 'PHYS101', name: 'General Physics I', university: 'Technical Institute' },
  { code: 'PHYS102', name: 'General Physics II', university: 'Technical Institute' },
] as const;

export const SEMESTER_OPTIONS = [
  'Semester 1',
  'Semester 2', 
  'Special Term 1',
  'Special Term 2',
  'Summer Session',
  'Winter Session'
] as const;
