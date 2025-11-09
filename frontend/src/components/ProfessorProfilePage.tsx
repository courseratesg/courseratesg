import { useState, useEffect } from 'react';
import { User, Star, TrendingUp, BookOpen, Calendar, Building, Award, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getReviewsByProfessor, getProfessorStats } from '../services/api';
import type { Review } from '../App';

interface ProfessorProfilePageProps {
  professorName: string;
}

export function ProfessorProfilePage({ professorName }: ProfessorProfilePageProps) {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    averageOverall: 0,
    averageDifficulty: 0,
    totalReviews: 0
  });
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    const loadData = async () => {
      const professorReviews = await getReviewsByProfessor(professorName);
      const sortedReviews = professorReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllReviews(sortedReviews);
      const professorStats = await getProfessorStats(professorName);
      setStats({
        averageOverall: professorStats.averageOverall,
        averageDifficulty: professorStats.averageDifficulty,
        totalReviews: professorStats.totalReviews
      });
    };
    loadData();
  }, [professorName]);

  useEffect(() => {
    let filtered = allReviews;
    if (courseFilter && courseFilter !== 'all') {
      filtered = allReviews.filter(review => review.courseCode === courseFilter);
    }
    setFilteredReviews(filtered);
    setDisplayCount(5); // Reset display count when filter changes
  }, [allReviews, courseFilter]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getUniversities = () => {
    const universities = new Set(allReviews.map(review => review.universityName));
    return Array.from(universities);
  };

  const getUniqueCourses = () => {
    const courses = new Set<string>();
    allReviews.forEach(review => {
      courses.add(review.courseCode);
    });
    return Array.from(courses).sort();
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  if (allReviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 mb-4">
              <User className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl mb-2 text-gray-600">No reviews found</h3>
            <p className="text-gray-500">
              No reviews were found for "{professorName}". Try a different spelling or check the professor's name.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Professor Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-8">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-600 p-3 rounded-full">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl mb-2 text-gray-900">{professorName}</h1>
            <p className="text-gray-600 mb-4">Professor Profile</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/70 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Overall Rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(stats.averageOverall))}
                  <span className="text-lg font-semibold">{stats.averageOverall.toFixed(1)}/5</span>
                </div>
              </div>
              
              <div className="bg-white/70 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Average Difficulty</span>
                </div>
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(stats.averageDifficulty))}
                  <span className="text-lg font-semibold">{stats.averageDifficulty.toFixed(1)}/5</span>
                </div>
              </div>
              
              <div className="bg-white/70 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Total Reviews</span>
                </div>
                <span className="text-2xl font-semibold">{stats.totalReviews}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-blue-600" />
            <span>Universities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getUniversities().map((university, index) => (
              <Badge key={index} variant="secondary">
                {university}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-gray-900">Student Reviews</h2>
          
          {/* Course Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {getUniqueCourses().map((courseCode) => (
                  <SelectItem key={courseCode} value={courseCode}>
                    {courseCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <BookOpen className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg mb-2 text-gray-600">No reviews found</h3>
              <p className="text-gray-500">
                {courseFilter && courseFilter !== 'all' 
                  ? `No reviews found for ${courseFilter}.`
                  : 'No reviews match the current filter.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6">
              {filteredReviews.slice(0, displayCount).map((review) => (
                <Card key={review.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <span>{review.courseCode}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-base font-normal">{review.courseName}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{review.universityName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{review.yearTaken}</span>
                          </div>
                          {review.semester && (
                            <div className="flex items-center space-x-1">
                              <span>•</span>
                              <span>{review.semester}</span>
                            </div>
                          )}
                        </div>
                        <CardDescription>
                          Reviewed in {formatDate(review.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {review.gradeReceived && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <Award className="h-3 w-3" />
                            <span>{review.gradeReceived}</span>
                          </Badge>
                        )}
                        {review.gradeExpected && (
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <span className="text-xs">Expected: {review.gradeExpected}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Ratings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">Overall Rating</p>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.overallRating)}
                            <span className="text-sm text-gray-600">{review.overallRating}/5</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">Difficulty</p>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.difficultyRating)}
                            <span className="text-sm text-gray-600">{review.difficultyRating}/5</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">Workload</p>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.workloadRating)}
                            <span className="text-sm text-gray-600">{review.workloadRating}/5</span>
                          </div>
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="border-l-4 border-blue-200 pl-4">
                        <p className="text-gray-700 leading-relaxed italic">"{review.reviewText}"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {filteredReviews.length > displayCount && (
              <div className="text-center pt-4">
                <Button onClick={handleLoadMore} variant="outline" className="flex items-center space-x-2">
                  <ChevronDown className="h-4 w-4" />
                  <span>Load More Reviews ({filteredReviews.length - displayCount} remaining)</span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}