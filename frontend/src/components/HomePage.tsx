import React, { useState, useEffect } from 'react';
import { Search, User, BookOpen, Star, TrendingUp, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from './ui/utils';
import { 
  searchProfessors, 
  searchCourses, 
  getProfessorStats, 
  getCourseStats,
  getProfessors,
  getCourses
} from '../services/api';
import type { Course, Professor } from '../services/api';

interface HomePageProps {
  onProfessorClick: (professorName: string) => void;
  onCourseClick: (courseCode: string, universityName: string) => void;
  currentUser?: { id: string; name: string; email: string } | null;
  onNavigate?: (page: 'submit-review' | 'login') => void;
}

// Professor Result Card Component
function ProfessorResultCard({ professor, onClick }: { professor: Professor; onClick: () => void }) {
  const [stats, setStats] = React.useState({ averageOverall: 0, averageDifficulty: 0, totalReviews: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStats = async () => {
      const result = await getProfessorStats(professor.name);
      setStats(result);
      setLoading(false);
    };
    loadStats();
  }, [professor.name]);

  if (loading) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>{professor.name}</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {professor.university || 'Unknown University'}
            </CardDescription>
          </div>
          <Badge variant="secondary">{stats.totalReviews} reviews</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>Overall: {stats.averageOverall.toFixed(1)}/5</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <span>Difficulty: {stats.averageDifficulty.toFixed(1)}/5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Course Result Card Component
function CourseResultCard({ course, onClick }: { course: Course; onClick: () => void }) {
  const [stats, setStats] = React.useState({ averageDifficulty: 0, averageWorkload: 0, totalReviews: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStats = async () => {
      const result = await getCourseStats(course.code, course.university);
      setStats(result);
      setLoading(false);
    };
    loadStats();
  }, [course.code, course.university]);

  if (loading) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span>{course.code}</span>
            </CardTitle>
            <CardDescription className="text-xs">{course.university}</CardDescription>
          </div>
          <Badge variant="secondary">{stats.totalReviews} reviews</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <span>Difficulty: {stats.averageDifficulty.toFixed(1)}/5</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-orange-500" />
            <span>Workload: {stats.averageWorkload.toFixed(1)}/5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomePage({ onProfessorClick, onCourseClick, currentUser, onNavigate }: HomePageProps) {
  const [searchType, setSearchType] = useState<'professor' | 'course'>('professor');
  const [query, setQuery] = useState('');
  const [professorResults, setProfessorResults] = useState<Professor[]>([]);
  const [courseResults, setCourseResults] = useState<Course[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Dropdown states
  const [professorList, setProfessorList] = useState<string[]>([]);
  const [courseList, setCourseList] = useState<string[]>([]);
  const [professorDropdownOpen, setProfessorDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const professorTriggerRef = React.useRef<HTMLButtonElement>(null);
  const courseTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number>(300);
  
  // Load professors and courses on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [professors, courses] = await Promise.all([
          getProfessors(),
          getCourses()
        ]);
        setProfessorList(professors);
        setCourseList(courses);
      } catch (error) {
        console.error('Error loading professors/courses:', error);
      }
    };
    loadData();
  }, []);

  // Update popover width when dropdown opens
  useEffect(() => {
    if (professorDropdownOpen && professorTriggerRef.current) {
      setPopoverWidth(professorTriggerRef.current.offsetWidth);
    }
  }, [professorDropdownOpen]);

  useEffect(() => {
    if (courseDropdownOpen && courseTriggerRef.current) {
      setPopoverWidth(courseTriggerRef.current.offsetWidth);
    }
  }, [courseDropdownOpen]);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchPerformed(false);
      return;
    }

    if (searchType === 'professor') {
      const results = await searchProfessors(trimmedQuery);
      setProfessorResults(results);
      setCourseResults([]);
    } else {
      const results = await searchCourses(trimmedQuery);
      setCourseResults(results);
      setProfessorResults([]);
    }

    setSearchPerformed(true);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl mb-4 text-gray-900">Find and Review Professors & Courses</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Search for professors and courses, read anonymous reviews, and share your own experiences 
          to help fellow students make informed decisions.
        </p>
      </div>

      {/* Search Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Database</span>
          </CardTitle>
          <CardDescription>
            Find professors with fuzzy search or courses with exact course codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setSearchType('professor');
                setQuery('');
                setSearchPerformed(false);
                setProfessorDropdownOpen(false);
                setCourseDropdownOpen(false);
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                searchType === 'professor' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Search Professors</span>
            </button>
            <button
              onClick={() => {
                setSearchType('course');
                setQuery('');
                setSearchPerformed(false);
                setProfessorDropdownOpen(false);
                setCourseDropdownOpen(false);
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                searchType === 'course' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Search Courses</span>
            </button>
          </div>

          {/* Search Input with Dropdown */}
          <div className="flex space-x-2">
            {searchType === 'professor' ? (
              <Popover open={professorDropdownOpen} onOpenChange={setProfessorDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={professorTriggerRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={professorDropdownOpen}
                    className="w-full justify-between flex-1"
                  >
                    <span className={cn("truncate", !query && "text-muted-foreground")}>
                      {query || 'Search professor...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0" 
                  align="start"
                  style={{ width: `${popoverWidth}px` }}
                >
                  <Command>
                    <CommandInput 
                      placeholder="Search professor..." 
                      value={query}
                      onValueChange={(value: string) => {
                        setQuery(value);
                        setSearchPerformed(false);
                      }}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' && query) {
                          setProfessorDropdownOpen(false);
                          handleSearch();
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No professor found.</CommandEmpty>
                      <CommandGroup>
                        {professorList
                          .filter((professor) =>
                            professor.toLowerCase().includes(query.toLowerCase())
                          )
                          .map((professor) => (
                            <CommandItem
                              key={professor}
                              value={professor}
                              onSelect={(currentValue: string) => {
                                setQuery(currentValue);
                                setProfessorDropdownOpen(false);
                                // Trigger search when a value is selected
                                setTimeout(() => {
                                  handleSearch();
                                }, 0);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  query === professor ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {professor}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Popover open={courseDropdownOpen} onOpenChange={setCourseDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={courseTriggerRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={courseDropdownOpen}
                    className="w-full justify-between flex-1"
                  >
                    <span className={cn("truncate", !query && "text-muted-foreground")}>
                      {query || 'Search course...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0" 
                  align="start"
                  style={{ width: `${popoverWidth}px` }}
                >
                  <Command>
                    <CommandInput 
                      placeholder="Search course code..." 
                      value={query}
                      onValueChange={(value: string) => {
                        setQuery(value);
                        setSearchPerformed(false);
                      }}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' && query) {
                          setCourseDropdownOpen(false);
                          handleSearch();
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No course found.</CommandEmpty>
                      <CommandGroup>
                        {courseList
                          .filter((course) =>
                            course.toUpperCase().includes(query.toUpperCase())
                          )
                          .map((course) => (
                            <CommandItem
                              key={course}
                              value={course}
                              onSelect={(currentValue: string) => {
                                setQuery(currentValue);
                                setCourseDropdownOpen(false);
                                // Trigger search when a value is selected
                                setTimeout(() => {
                                  handleSearch();
                                }, 0);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  query === course ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {course}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            {searchType === 'professor' && (
              <p>💡 Professor search uses fuzzy matching - try partial names or variations</p>
            )}
            {searchType === 'course' && (
              <p>💡 Course search requires exact course code matching</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchPerformed && (professorResults.length > 0 || courseResults.length > 0) && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl mb-6 text-gray-900">
            Search Results ({professorResults.length + courseResults.length} found)
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Professor Results */}
            {professorResults.map((professor) => (
              <ProfessorResultCard 
                key={`${professor.id}-${professor.name}`}
                professor={professor}
                onClick={() => onProfessorClick(professor.name)}
              />
            ))}

            {/* Course Results */}
            {courseResults.map((course, index) => (
              <CourseResultCard
                key={index}
                course={course}
                onClick={() => onCourseClick(course.code, course.university)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchPerformed && professorResults.length === 0 && courseResults.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg text-gray-600 mb-2">No results found</h3>
          <p className="text-gray-500">
            {searchType === 'professor' 
              ? 'Try a different professor name or check the spelling'
              : 'Make sure you entered the exact course code'
            }
          </p>
        </div>
      )}

      {/* Getting Started */}
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-blue-600" />
                <span>How to Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-700">Professor Search</p>
                <p className="text-sm text-gray-600">
                  Use fuzzy matching to find professors by name. 
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Course Search</p>
                <p className="text-sm text-gray-600">
                  Enter the exact course code to find all sections across universities.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Anonymous Reviews</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                All reviews are completely anonymous. Share your honest experiences to help other students.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  if (onNavigate) {
                    if (currentUser) {
                      onNavigate('submit-review');
                    } else {
                      onNavigate('login');
                    }
                  }
                }}
              >
                Submit Review
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}