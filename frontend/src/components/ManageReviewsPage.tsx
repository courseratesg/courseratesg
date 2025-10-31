import { useState, useEffect } from 'react';
import { Edit, Trash2, Star, Calendar, Building, BookOpen, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { EditReviewDialog } from './EditReviewDialog';
import { getMyReviews, deleteReview } from '../services/api';
import type { User as UserType, Review, PageType } from '../App';

interface ManageReviewsPageProps {
  currentUser: UserType;
  onNavigate?: (page: PageType) => void;
}

export function ManageReviewsPage({ currentUser, onNavigate }: ManageReviewsPageProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    loadUserReviews();
  }, [currentUser.id]);

  const loadUserReviews = async () => {
    const userReviews = await getMyReviews(currentUser.id);
    setReviews(userReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      await loadUserReviews();
      toast.success('Review deleted successfully');
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
  };

  const handleEditComplete = () => {
    setEditingReview(null);
    loadUserReviews();
  };

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
      month: 'long',
      day: 'numeric'
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-900">My Reviews</h1>
          <p className="text-gray-600">
            Manage and edit your submitted course reviews
          </p>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 mb-4">
              <BookOpen className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl mb-2 text-gray-600">No reviews yet</h3>
            <p className="text-gray-500 mb-6">
              You haven't submitted any course reviews. Start sharing your experiences to help other students!
            </p>
            <Button onClick={() => onNavigate ? onNavigate('submit-review') : window.location.reload()}>
              Submit Your First Review
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-gray-900">My Reviews</h1>
        <p className="text-gray-600">
          You have submitted {reviews.length} review{reviews.length !== 1 ? 's' : ''}. 
          You can edit or delete them at any time.
        </p>
      </div>

      <div className="grid gap-6">
        {reviews.map((review) => (
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
                      <User className="h-4 w-4" />
                      <span>{review.professorName}</span>
                    </div>
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
                    Submitted on {formatDate(review.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditReview(review)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this review for {review.courseCode}? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteReview(review.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Review
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Teaching Quality</p>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.teachingRating)}
                      <span className="text-sm text-gray-600">{review.teachingRating}/5</span>
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
                <div>
                  <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
                </div>

                {/* Grade Badges */}
                <div className="flex items-center space-x-4">
                  {review.gradeReceived && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Grade received:</span>
                      <Badge variant="secondary">{review.gradeReceived}</Badge>
                    </div>
                  )}
                  {review.gradeExpected && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Expected:</span>
                      <Badge variant="outline">{review.gradeExpected}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Review Dialog */}
      <EditReviewDialog
        review={editingReview}
        isOpen={!!editingReview}
        onClose={() => setEditingReview(null)}
        onSave={handleEditComplete}
      />
    </div>
  );
}