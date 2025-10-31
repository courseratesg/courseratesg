import { useState, useEffect } from 'react';
import { Search, User, LogOut, BookOpen, GraduationCap, LogIn } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { SubmitReviewPage } from './components/SubmitReviewPage';
import { ManageReviewsPage } from './components/ManageReviewsPage';
import { ProfessorProfilePage } from './components/ProfessorProfilePage';
import { CourseProfilePage } from './components/CourseProfilePage';
import { Button } from './components/ui/button';
import { authService } from './services/auth-service';

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Review = {
  id: string;
  userId: string;
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
  createdAt: Date;
};

export type PageType = 'home' | 'login' | 'submit-review' | 'manage-reviews' | 'professor-profile' | 'course-profile';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedProfessor, setSelectedProfessor] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; university: string }>({ code: '', university: '' });

  // Check for authenticated user on mount using AWS Amplify auth service
  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
      setCurrentPage('home');
    };
    checkAuth();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('home');
  };

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const navigateToPage = (page: PageType) => {
    setCurrentPage(page);
  };

  const navigateToProfessor = (professorName: string) => {
    setSelectedProfessor(professorName);
    setCurrentPage('professor-profile');
  };

  const navigateToCourse = (courseCode: string, universityName: string) => {
    setSelectedCourse({ code: courseCode, university: universityName });
    setCurrentPage('course-profile');
  };

  // Show login page when navigating to login
  if (!currentUser && currentPage === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateToPage('home')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <GraduationCap className="h-6 w-6" />
                <span className="font-semibold">CourseRate SG</span>
              </button>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => navigateToPage('home')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  currentPage === 'home' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Search
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => navigateToPage('submit-review')}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentPage === 'submit-review' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Submit Review
                  </button>
                  <button
                    onClick={() => navigateToPage('manage-reviews')}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentPage === 'manage-reviews' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    My Reviews
                  </button>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{currentUser.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigateToPage('login')}
                  className="flex items-center space-x-1"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {currentUser && (
          <div className="md:hidden border-t bg-gray-50 px-4 py-2">
            <div className="flex justify-around">
              <button
                onClick={() => navigateToPage('home')}
                className={`flex flex-col items-center py-2 px-3 rounded transition-colors ${
                  currentPage === 'home' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Search className="h-5 w-5" />
                <span className="text-xs mt-1">Search</span>
              </button>
              <button
                onClick={() => navigateToPage('submit-review')}
                className={`flex flex-col items-center py-2 px-3 rounded transition-colors ${
                  currentPage === 'submit-review' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-xs mt-1">Review</span>
              </button>
              <button
                onClick={() => navigateToPage('manage-reviews')}
                className={`flex flex-col items-center py-2 px-3 rounded transition-colors ${
                  currentPage === 'manage-reviews' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">My Reviews</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && (
          <HomePage
            onProfessorClick={navigateToProfessor}
            onCourseClick={navigateToCourse}
          />
        )}
        {currentPage === 'submit-review' && currentUser && <SubmitReviewPage currentUser={currentUser} />}
        {currentPage === 'manage-reviews' && currentUser && <ManageReviewsPage currentUser={currentUser} onNavigate={navigateToPage} />}
        {currentPage === 'professor-profile' && (
          <ProfessorProfilePage professorName={selectedProfessor} />
        )}
        {currentPage === 'course-profile' && (
          <CourseProfilePage
            courseCode={selectedCourse.code}
            universityName={selectedCourse.university}
          />
        )}
      </main>
    </div>
  );
}

export default App;