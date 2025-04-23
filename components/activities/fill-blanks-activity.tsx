"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { saveActivityProgress } from "@/app/actions/activity-actions"
import { useToast } from "@/components/ui/use-toast"

interface FillBlanksActivityProps {
  activity: any
  progress?: any
  isLastActivity?: boolean
  courseId?: string
  nextActivityId?: string
  userId?: string
  isCompleted?: boolean
  userAnswer?: any
  allActivitiesCompleted?: boolean
}

export function FillBlanksActivity({
  activity,
  progress,
  isLastActivity = false,
  allActivitiesCompleted = false,
  courseId,
  nextActivityId,
  userId,
  isCompleted,
  userAnswer,
}: FillBlanksActivityProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const content = activity.content || {
    title: "Animals and Their Homes",
    instructions: "Fill in the blanks with the correct animal names.",
    sentences: [
      { id: "s1", text: "A _____ lives in a den.", answer: "fox" },
      { id: "s2", text: "A _____ and a _____ share a tree.", answer: "bird, squirrel" },
      { id: "s3", text: "A _____ lives in a hive and makes honey.", answer: "bee" },
    ],
  }

  useEffect(() => {
    const initialAnswers: Record<string, string[]> = {}
    content.sentences.forEach((sentence: { id: string }) => {
      const blanksCount = sentence.text.split("_____").length - 1
      const progressAnswersObj = progress?.answers ? JSON.parse(progress?.answers) : undefined
      const userAnswerObj = userAnswer ? JSON.parse(userAnswer) : undefined
      const savedAnswers = progressAnswersObj?.[sentence.id] || userAnswerObj?.[sentence.id]
      initialAnswers[sentence.id] =
        savedAnswers && Array.isArray(savedAnswers)
          ? savedAnswers
          : Array(blanksCount).fill("")
    })
    setAnswers(initialAnswers)
    console.log('initialAnswers', initialAnswers)
    setSubmitted(progress?.completed || isCompleted || false)
    setScore(progress?.score || 0)
  }, [progress, userAnswer, isCompleted, content.sentences])

  const handleAnswerChange = (sentenceId: string, updatedAnswers: string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [sentenceId]: updatedAnswers,
    }))
  }

  const handleSubmit = async () => {
    const allFilled = content.sentences.every((sentence: any) => {
      const blanks = sentence.text.split("_____").length - 1
      const ansArray = answers[sentence.id] || []
      return ansArray.length === blanks && ansArray.every((a: string) => a.trim() !== "")
    })

    if (!allFilled) return

    setIsSaving(true)
    setSubmitted(true)
    const newScore = getScore()
    setScore(newScore)

    try {
      if (activity.id) {
        await saveActivityProgress({
          activityId: activity.id,
          userId: userId,
          score: newScore,
          isCompleted: true,
          answers: answers,
          timeSpent: 0,
        })

        toast({
          title: "Activity completed",
          description: "Your progress has been saved successfully.",
        })
      }
    } catch (error) {
      console.error("Error saving progress:", error)
      toast({
        title: "Error saving progress",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      router.refresh()
    }
  }

  const getScore = () => {
    let totalCorrect = 0
    let totalBlanks = 0

    content.sentences.forEach((sentence: any) => {
      const correctAnswers = Array.isArray(sentence.answer)
        ? sentence.answer
        : sentence.answer.split(",").map((a: string) => a.trim())

      const userAnswers = answers[sentence.id] || []
      totalBlanks += correctAnswers.length

      correctAnswers.forEach((correct: string, index: number) => {
        if ((userAnswers[index] || "").trim().toLowerCase() === correct.toLowerCase()) {
          totalCorrect++
        }
      })
    })

    if (totalBlanks === 0) return 0
    return Math.round((totalCorrect / totalBlanks) * 100)
  }



  const renderSentence = (sentence: any) => {
    const parts = sentence.text.split("_____")
    const blanksCount = parts.length - 1
    console.log('renderSentence', answers[sentence.id])
    const currentAnswers: string[] = answers[sentence.id] || Array(blanksCount).fill("")

    const correctAnswers: string[] = Array.isArray(sentence.answer)
      ? sentence.answer
      : sentence.answer.split(",").map((a: string) => a.trim())

    return (
      <div className="flex items-center flex-wrap flex-row gap-1">
        {parts.map((part: string, index: number) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < blanksCount && (
              <>
                <Input
                  value={currentAnswers[index] || ""}
                  onChange={(e) => {
                    const updated = [...currentAnswers]
                    updated[index] = e.target.value
                    handleAnswerChange(sentence.id, updated)
                  }}
                  className="w-32 inline-block mx-2"
                  disabled={submitted}
                />
                {submitted && (
                  <span className="ml-1">
                    {currentAnswers[index]?.trim().toLowerCase() ===
                    (correctAnswers[index]?.trim().toLowerCase() || "") ? (
                      <CheckCircle className="h-5 w-5 text-green-500 inline" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 inline" />
                    )}
                  </span>
                )}
              </>
            )}
          </React.Fragment>
        ))}
      </div>
    )
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

      <div>
        <p className="text-muted-foreground">{content.instructions}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {content.sentences.map((sentence: any) => (
            <div key={sentence.id} className="py-2">
              {renderSentence(sentence)}
              {submitted &&
                (Array.isArray(sentence.answer)
                  ? sentence.answer
                  : sentence.answer.split(",")).some(
                  (correct: string, i: number) =>
                    (answers[sentence.id]?.[i] || "").trim().toLowerCase() !== correct.trim().toLowerCase()
                ) && (
                  <p className="text-sm text-red-500 mt-1">
                    Correct answer: {Array.isArray(sentence.answer) ? sentence.answer.join(", ") : sentence.answer}
                  </p>
                )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!submitted ? (
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={
            isSaving ||
            !content.sentences.every((sentence: any) => {
              const blanks = sentence.text.split("_____").length - 1
              const ansArray = answers[sentence.id] || []
              return ansArray.length === blanks && ansArray.every((a: string) => a.trim() !== "")
            })
          }
        >
          {isSaving ? "Saving..." : "Check Answers"}
        </Button>
      ) : (
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

export default FillBlanksActivity
