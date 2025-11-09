import React, { useState } from 'react';
import { Star, BookOpen, User, Building, Calendar, Award, AlertCircle, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { createReview, getProfessors, getUniversities, generateAcademicYearOptions, getCurrentAcademicYear, SEMESTER_OPTIONS } from '../services/api';
import type { User as UserType } from '../App';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from './ui/utils';

interface SubmitReviewPageProps {
  currentUser: UserType;
  onReviewSubmitted?: () => void;
}

interface ReviewForm {
  courseCode: string;
  yearTaken: string;
  semester: string;
  professorName: string;
  universityName: string;
  overallRating: number;
  difficultyRating: number;
  workloadRating: number;
  reviewText: string;
  gradeReceived: string;
  gradeExpected: string;
}

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'Pass', 'Fail', 'Withdraw'];

export function SubmitReviewPage({ currentUser, onReviewSubmitted }: SubmitReviewPageProps) {
  const [form, setForm] = useState<ReviewForm>({
    courseCode: '',
    yearTaken: getCurrentAcademicYear(),
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
  const [isAddProfessorDialogOpen, setIsAddProfessorDialogOpen] = useState(false);
  const [isProfessorPickerOpen, setIsProfessorPickerOpen] = useState(false);
  const [newProfessorForm, setNewProfessorForm] = useState({
    professorName: '',
    universityName: ''
  });

  const [professors, setProfessors] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  React.useEffect(() => {
    const loadDropdownData = async () => {
      const [profList, uniList] = await Promise.all([
        getProfessors(),
        getUniversities(),
      ]);
      setProfessors(profList);
      setUniversities(uniList);
    };
    loadDropdownData();
  }, []);

  const handleInputChange = (field: keyof ReviewForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingClick = (field: 'overallRating' | 'difficultyRating' | 'workloadRating', rating: number) => {
    setForm(prev => ({ ...prev, [field]: rating }));
  };

  const isFormValid = () => {
    return form.courseCode.trim() &&
           form.yearTaken &&
           form.professorName.trim() &&
           form.universityName.trim() &&
           form.overallRating > 0 &&
           form.difficultyRating > 0 &&
           form.workloadRating > 0 &&
           form.reviewText.trim().length >= 20;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error('Please fill in all required fields and provide ratings');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReview(
        {
          courseCode: form.courseCode,
          yearTaken: form.yearTaken,
          semester: form.semester || undefined,
          professorName: form.professorName,
          universityName: form.universityName,
          overallRating: form.overallRating,
          difficultyRating: form.difficultyRating,
          workloadRating: form.workloadRating,
          reviewText: form.reviewText,
          gradeReceived: form.gradeReceived || undefined,
          gradeExpected: form.gradeExpected || undefined
        },
        currentUser.id
      );
      
      toast.success('Review submitted successfully!');
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      // Reset form
      setForm({
        courseCode: '',
        yearTaken: getCurrentAcademicYear(),
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

      // Refresh dropdown data
      const [profList, uniList] = await Promise.all([
        getProfessors(),
        getUniversities()
      ]);
      setProfessors(profList);
      setUniversities(uniList);

    } catch (error) {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const professorRequestMailto = React.useMemo(() => {
    const name = newProfessorForm.professorName.trim();
    const university = newProfessorForm.universityName.trim();
    if (!name || !university) {
      return null;
    }
    const subject = encodeURIComponent('Request to add professor - CourseRateSG');
    const body = encodeURIComponent(`Professor Name: ${name}\nUniversity: ${university}`);
    return `mailto:admin@courseratesg.xyz?subject=${subject}&body=${body}`;
  }, [newProfessorForm.professorName, newProfessorForm.universityName]);

  const renderStarRating = (
    field: 'overallRating' | 'difficultyRating' | 'workloadRating',
    value: number,
    label: string,
    description: string
  ) => (
    <div className="space-y-2">
      <Label className="flex items-center space-x-2">
        <Star className="h-4 w-4" />
        <span>{label} *</span>
      </Label>
      <p className="text-sm text-gray-600">{description}</p>
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
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        {value > 0 ? `${value}/5 stars` : 'Click to rate'}
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-gray-900">Submit a Course Review</h1>
        <p className="text-gray-600">
          Share your experience anonymously to help other students make informed decisions.
          Your personal information will never be displayed with the review.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8">
          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Course Information</span>
              </CardTitle>
              <CardDescription>
                Basic information about the course you're reviewing
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courseCode" className="flex items-center space-x-2">
                  <span>Course Code *</span>
                </Label>
                <Input
                  id="courseCode"
                  placeholder="e.g., CS101, MATH220"
                  value={form.courseCode}
                  onChange={(e) => handleInputChange('courseCode', e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearTaken" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Academic Year Taken *</span>
                </Label>
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
                <Label htmlFor="semester" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Semester (Optional)</span>
                </Label>
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
                <Label htmlFor="gradeReceived" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Grade Received (Optional)</span>
                </Label>
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
                <Label htmlFor="gradeExpected" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Grade Expected (Optional)</span>
                </Label>
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
            </CardContent>
          </Card>

          {/* Professor & University */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <span>Professor & University</span>
              </CardTitle>
              <CardDescription>
                Information about the professor and institution
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <span>Professor Name *</span>
                </Label>
                <Popover open={isProfessorPickerOpen} onOpenChange={setIsProfessorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isProfessorPickerOpen}
                      className="w-full justify-between"
                    >
                      {form.professorName ? (
                        <span className="truncate">{form.professorName}</span>
                      ) : (
                        <span className="text-muted-foreground">Select or search professor</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search professor..." />
                      <CommandEmpty>No professor found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {professors.map((professor) => (
                            <CommandItem
                              key={professor}
                              value={professor}
                              onSelect={(currentValue: string) => {
                                handleInputChange('professorName', currentValue);
                                setIsProfessorPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  form.professorName === professor ? 'opacity-100' : 'opacity-0'
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
                <Dialog open={isAddProfessorDialogOpen} onOpenChange={setIsAddProfessorDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      <span>Professor not found? Let the admin know!</span>
                    </button>
                  </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Request New Professor</DialogTitle>
                      <DialogDescription>
                        Can't find your professor? Let us know and we'll add them to the system.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => e.preventDefault()}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="newProfessorName">Professor Name *</Label>
                        <Input
                          id="newProfessorName"
                          placeholder="Enter professor's full name"
                          value={newProfessorForm.professorName}
                          onChange={(e) => setNewProfessorForm(prev => ({ ...prev, professorName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newProfessorUniversity">University *</Label>
                        <Select
                          value={newProfessorForm.universityName}
                          onValueChange={(value: string) => setNewProfessorForm(prev => ({ ...prev, universityName: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select university" />
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
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddProfessorDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          asChild
                          disabled={!professorRequestMailto}
                        >
                          <a
                            href={professorRequestMailto || undefined}
                            onClick={() => {
                              if (professorRequestMailto) {
                                setIsAddProfessorDialogOpen(false);
                              }
                            }}
                          >
                            Submit Request
                          </a>
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                <Label htmlFor="universityName" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>University Name *</span>
                </Label>
                <Select
                  value={form.universityName}
                  onValueChange={(value: string) => handleInputChange('universityName', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select university" />
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
            </CardContent>
          </Card>

          {/* Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Ratings</span>
              </CardTitle>
              <CardDescription>
                Rate your experience on a scale of 1-5 stars
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {renderStarRating(
                'overallRating',
                form.overallRating,
                'Overall Rating',
                'How would you rate your overall experience with the course and professor?'
              )}

              {renderStarRating(
                'difficultyRating',
                form.difficultyRating,
                'Course Difficulty',
                'How challenging was the course material and exams?'
              )}

              {renderStarRating(
                'workloadRating',
                form.workloadRating,
                'Workload',
                'How heavy was the coursework and time commitment?'
              )}
            </CardContent>
          </Card>

          {/* Review Text */}
          <Card>
            <CardHeader>
              <CardTitle>Written Review</CardTitle>
              <CardDescription>
                Share your detailed experience (minimum 20 characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="reviewText">Your Review *</Label>
                <Textarea
                  id="reviewText"
                  placeholder="Share your experience with this course and professor. What did you like? What could be improved? Any tips for future students?"
                  value={form.reviewText}
                  onChange={(e) => handleInputChange('reviewText', e.target.value)}
                  rows={5}
                  required
                />
                <p className="text-sm text-gray-500">
                  {form.reviewText.length}/20 characters minimum
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to clear the form?')) {
                  setForm({
                    courseCode: '',
                    yearTaken: getCurrentAcademicYear(),
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
                }
              }}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}