"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { saveActivityProgress } from "@/app/actions/activity-actions"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Trophy } from "lucide-react"

interface MultipleChoiceActivityProps {
  activity: any
  userId: string
  progress?: any
  isLastActivity?: boolean
  courseId?: string
  nextActivityId?: string
  isCompleted?: boolean
  userAnswer?: any
  allActivitiesCompleted?: boolean
}

export function MultipleChoiceActivity({
  activity,
  userId,
  progress,
  isLastActivity,
  courseId,
  nextActivityId,
  isCompleted: propIsCompleted,
  userAnswer: propUserAnswer,
  allActivitiesCompleted = false,
}: MultipleChoiceActivityProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(propIsCompleted || false)
  const [score, setScore] = useState<number | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(true)

  const questions = activity.content?.questions || []

  useEffect(() => {
    // Initialize from either progress or props
    if (progress?.completed || propIsCompleted) {
      setIsCompleted(true)
      setScore(progress?.score || 0)

      // Initialize answers from saved progress
      let savedAnswers = {}

      if (progress?.answers) {
        try {
          savedAnswers = typeof progress.answers === "string" ? JSON.parse(progress.answers) : progress.answers
        } catch (error) {
          console.error("Error parsing saved answers:", error)
        }
      } else if (propUserAnswer) {
        try {
          savedAnswers = typeof propUserAnswer === "string" ? JSON.parse(propUserAnswer) : propUserAnswer
        } catch (error) {
          console.error("Error parsing user answers:", error)
        }
      }

      setAnswers(savedAnswers)
    }
  }, [progress, propIsCompleted, propUserAnswer])

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }))
  }

  const calculateScore = () => {
    let correctCount = 0

    questions.forEach((question: any, index: number) => {
      const userAnswer = answers[index]
      if (userAnswer === question.correctAnswer) {
        correctCount++
      }
    })

    return Math.round((correctCount / questions.length) * 100)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const calculatedScore = calculateScore()

      await saveActivityProgress({
        userId,
        activityId: activity.id,
        isCompleted: true,
        score: calculatedScore,
        answers: answers,
      })

      setScore(calculatedScore)
      setIsCompleted(true)

      toast({
        title: "Activity completed!",
        description: `Your score: ${calculatedScore.toFixed(2)}%`,
      })
    } catch (error) {
      console.error("Error saving progress:", error)
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleViewMode = () => {
    setShowAllQuestions(!showAllQuestions)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const renderQuestion = (question: any, qIndex: number) => {
    return (
      <Card key={qIndex} className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Question {qIndex + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-700 mb-4">{question.question}</p>

            <RadioGroup
              value={answers[qIndex] || ""}
              onValueChange={(value) => handleAnswerChange(qIndex, value)}
              disabled={isCompleted}
            >
              {question.options.map((option: string, oIndex: number) => (
                <div key={oIndex} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={option} id={`q${qIndex}-option-${oIndex}`} />
                  <Label htmlFor={`q${qIndex}-option-${oIndex}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {isCompleted && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="font-medium text-green-800">
                Correct answer: <span className="text-green-700">{question.correctAnswer}</span>
              </p>
              {question.explanation && (
                <p className="mt-2 text-gray-700">
                  <span className="font-medium">Explanation:</span> {question.explanation}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const areAllQuestionsAnswered = () => {
    return questions.every((_, index) => answers[index] !== undefined)
  }

  const handleBackToCourse = () => {
    if (courseId) {
      router.push(`/dashboard/courses/${courseId}`)
    } else {
      router.push("/dashboard/activities")
    }
  }

  return (
    <div className="space-y-6">
      {allActivitiesCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
          <Trophy className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">Congratulations!</h2>
          <p className="text-green-600 mb-4">
            You've completed all activities in this course. Great job on your learning journey!
          </p>
          <Button onClick={handleBackToCourse} className="bg-green-600 hover:bg-green-700">
            Back to Course
          </Button>
        </div>
      )}

      <div>{questions.map((question: any, index: number) => renderQuestion(question, index))}</div>

      {!isCompleted && (
        <Button className="w-full mt-6" onClick={handleSubmit} disabled={isSubmitting || !areAllQuestionsAnswered()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Answers"
          )}
        </Button>
      )}

      {!isCompleted && !areAllQuestionsAnswered() && (
        <p className="text-amber-600 text-center mt-2">Please answer all questions before submitting.</p>
      )}

      {isCompleted && (
        <div className="bg-muted p-4 rounded-md text-center">
          <p className="text-lg font-semibold">Your score: {score} out of 100</p>
          <p className="text-muted-foreground">
            {score === 100
              ? "Perfect! Great job!"
              : score > 75
                ? "Good job! Keep practicing!"
                : "Keep practicing to improve your score!"}
          </p>
        </div>
      )}

    </div>
  )
}

// Also export as default for backward compatibility
export default MultipleChoiceActivity
