import { useState, useEffect } from 'react';
import { Star, Save, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { updateReview, getProfessors, getUniversities, generateAcademicYearOptions, SEMESTER_OPTIONS } from '../services/api';
import type { Review } from '../App';

interface EditReviewDialogProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'Pass', 'Fail', 'Withdraw'];

export function EditReviewDialog({ review, isOpen, onClose, onSave }: EditReviewDialogProps) {
  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    yearTaken: '',
    semester: '',
    professorName: '',
    universityName: '',
    overallRating: 0,
    difficultyRating: 0,
    workloadRating: 0,
    reviewText: '',
    gradeReceived: '',
    gradeExpected: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professors, setProfessors] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);

  useEffect(() => {
    const loadDropdownData = async () => {
      const [profList, uniList] = await Promise.all([
        getProfessors(),
        getUniversities()
      ]);
      setProfessors(profList);
      setUniversities(uniList);
    };
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (review) {
      setForm({
        courseCode: review.courseCode,
        courseName: review.courseName,
        yearTaken: review.yearTaken,
        semester: review.semester || '',
        professorName: review.professorName,
        universityName: review.universityName,
        overallRating: review.overallRating,
        difficultyRating: review.difficultyRating,
        workloadRating: review.workloadRating,
        reviewText: review.reviewText,
        gradeReceived: review.gradeReceived || '',
        gradeExpected: review.gradeExpected || ''
      });
    }
  }, [review]);

  const handleInputChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingClick = (field: 'overallRating' | 'difficultyRating' | 'workloadRating', rating: number) => {
    setForm(prev => ({ ...prev, [field]: rating }));
  };

  const isFormValid = () => {
    return form.courseCode.trim() &&
           form.courseName.trim() &&
           form.yearTaken &&
           form.professorName.trim() &&
           form.universityName.trim() &&
           form.overallRating > 0 &&
           form.difficultyRating > 0 &&
           form.workloadRating > 0 &&
           form.reviewText.trim().length >= 20;
  };

  const handleSave = async () => {
    if (!review || !isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateReview(review.id, {
        courseCode: form.courseCode.trim().toUpperCase(),
        courseName: form.courseName.trim(),
        yearTaken: form.yearTaken,
        semester: form.semester || undefined,
        professorName: form.professorName.trim(),
        universityName: form.universityName.trim(),
        overallRating: form.overallRating,
        difficultyRating: form.difficultyRating,
        workloadRating: form.workloadRating,
        reviewText: form.reviewText.trim(),
        gradeReceived: form.gradeReceived || undefined,
        gradeExpected: form.gradeExpected || undefined
      });
      toast.success('Review updated successfully!');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to update review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    field: 'overallRating' | 'difficultyRating' | 'workloadRating',
    value: number,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label} *</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingClick(field, rating)}
            className={`p-1 rounded transition-colors ${
              rating <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
            }`}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500">{value}/5 stars</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
          <DialogDescription>
            Update your review details. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Course Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-courseCode">Course Code *</Label>
              <Input
                id="edit-courseCode"
                value={form.courseCode}
                onChange={(e) => handleInputChange('courseCode', e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-courseName">Course Name *</Label>
              <Input
                id="edit-courseName"
                value={form.courseName}
                onChange={(e) => handleInputChange('courseName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Professor Name *</Label>
              <Select
                value={form.professorName}
                onValueChange={(value: string) => handleInputChange('professorName', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {professors.map((professor) => (
                    <SelectItem key={professor} value={professor}>
                      {professor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>University Name *</Label>
              <Select
                value={form.universityName}
                onValueChange={(value: string) => handleInputChange('universityName', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((university) => (
                    <SelectItem key={university} value={university}>
                      {university}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Academic Year Taken *</Label>
              <Select
                value={form.yearTaken}
                onValueChange={(value: string) => handleInputChange('yearTaken', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateAcademicYearOptions().map((academicYear) => (
                    <SelectItem key={academicYear} value={academicYear}>
                      {academicYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semester (Optional)</Label>
              <Select
                value={form.semester}
                onValueChange={(value: string) => handleInputChange('semester', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTER_OPTIONS.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grade Received (Optional)</Label>
              <Select
                value={form.gradeReceived}
                onValueChange={(value: string) => handleInputChange('gradeReceived', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grade Expected (Optional)</Label>
              <Select
                value={form.gradeExpected}
                onValueChange={(value: string) => handleInputChange('gradeExpected', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expected grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ratings */}
          <div className="grid gap-4 md:grid-cols-3">
            {renderStarRating('overallRating', form.overallRating, 'Overall Rating')}
            {renderStarRating('difficultyRating', form.difficultyRating, 'Course Difficulty')}
            {renderStarRating('workloadRating', form.workloadRating, 'Workload')}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="edit-reviewText">Your Review *</Label>
            <Textarea
              id="edit-reviewText"
              value={form.reviewText}
              onChange={(e) => handleInputChange('reviewText', e.target.value)}
              rows={4}
              required
            />
            <p className="text-sm text-gray-500">
              {form.reviewText.length}/20 characters minimum
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid() || isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}