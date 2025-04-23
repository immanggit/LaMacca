"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { saveActivityProgress } from "@/app/actions/activity-actions"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Trophy } from "lucide-react"

interface MatchLinesActivityProps {
  activity: any
  userId: string
  progress?: any
  isLastActivity?: boolean
  courseId?: string
  nextActivityId?: string
  userAnswer: any
  allActivitiesCompleted?: boolean
}

export default function MatchLinesActivity({
  activity,
  userId,
  progress,
  isLastActivity = false,
  courseId,
  nextActivityId,
  userAnswer,
  allActivitiesCompleted = false,
}: MatchLinesActivityProps) {
  const [terms, setTerms] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [userMatches, setUserMatches] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(progress?.completed || false)
  const [score, setScore] = useState(progress?.score || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (activity?.content?.pairs) {
      const termItems = activity.content.pairs.map((pair: any) => ({
        id: pair.id,
        content: pair.term,
      }))

      const matchItems = activity.content.pairs.map((pair: any) => ({
        id: pair.id,
        content: pair.match,
      }))

      setTerms(shuffle([...termItems]))
      setMatches(shuffle([...matchItems]))
    }
  }, [activity])

  useEffect(() => {
    if (progress?.completed && progress.answers) {
      try {
        const savedAnswers = typeof progress.answers === "string" ? JSON.parse(progress.answers) : progress.answers
        setUserMatches(savedAnswers)

        const savedLines = Object.entries(savedAnswers).map(([termId, matchId]) => ({
          termId,
          matchId,
        }))
        setLines(savedLines)

        setSubmitted(true)
        setScore(progress.score || 0)
      } catch (error) {
        console.error("Error parsing saved answers:", error)
      }
    }
  }, [progress])

  useEffect(() => {
    drawLines()
  }, [lines])

  useEffect(() => {
    const handleResize = () => {
      drawLines()
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [lines])

  const handleBackToCourse = () => {
    if (courseId) {
      router.push(`/dashboard/courses/${courseId}`)
    } else {
      router.push("/dashboard/activities")
    }
  }

  const shuffle = (array: any[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const drawLines = () => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    lines.forEach((line) => {
      const termElement = document.getElementById(`term-${line.termId}`)
      const matchElement = document.getElementById(`match-${line.matchId}`)
      const containerRect = container.getBoundingClientRect()

      if (termElement && matchElement) {
        const termRect = termElement.getBoundingClientRect()
        const matchRect = matchElement.getBoundingClientRect()

        const startX = termRect.right - containerRect.left
        const startY = termRect.top + termRect.height / 2 - containerRect.top
        const endX = matchRect.left - containerRect.left
        const endY = matchRect.top + matchRect.height / 2 - containerRect.top

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)

        if (submitted) {
          if (line.termId === line.matchId) {
            ctx.strokeStyle = "#10b981"
          } else {
            ctx.strokeStyle = "#ef4444"
          }
        } else {
          ctx.strokeStyle = "#6366f1"
        }

        ctx.lineWidth = 2
        ctx.stroke()
      }
    })
  }

  const handleTermClick = (termId: string) => {
    if (submitted) return

    if (selectedTerm === termId) {
      setSelectedTerm(null)
      return
    }

    // If the term is already matched, remove its line and match
    if (userMatches[termId]) {
      const newUserMatches = { ...userMatches }
      const newLines = lines.filter((line) => line.termId !== termId)
      delete newUserMatches[termId]
      setUserMatches(newUserMatches)
      setLines(newLines)
      setSelectedTerm(null)
      return
    }

    setSelectedTerm(termId)
  }

  const handleMatchClick = (matchId: string) => {
    if (submitted || !selectedTerm) return

    const newLines = [...lines]

    // Remove existing line for selected term
    const existingTermIndex = newLines.findIndex((line) => line.termId === selectedTerm)
    if (existingTermIndex !== -1) {
      newLines.splice(existingTermIndex, 1)
    }

    // Remove existing line using this match
    const existingMatchIndex = newLines.findIndex((line) => line.matchId === matchId)
    if (existingMatchIndex !== -1) {
      newLines.splice(existingMatchIndex, 1)
    }

    // Remove previous match from other term
    const updatedUserMatches = { ...userMatches }
    for (const [termId, existingMatchId] of Object.entries(updatedUserMatches)) {
      if (existingMatchId === matchId) {
        delete updatedUserMatches[termId]
        break
      }
    }

    updatedUserMatches[selectedTerm] = matchId
    newLines.push({ termId: selectedTerm, matchId })

    setLines(newLines)
    setUserMatches(updatedUserMatches)
    setSelectedTerm(null)
  }

  const calculateScore = () => {
    let correctMatches = 0
    const totalPairs = activity.content.pairs.length

    Object.entries(userMatches).forEach(([termId, matchId]) => {
      if (termId === matchId) {
        correctMatches++
      }
    })

    return Math.round(correctMatches / totalPairs) * 100
  }

  const handleSubmit = async () => {
    if (!userId || !activity?.id) {
      toast({
        title: "Error",
        description: "Missing required information to save progress",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    const newScore = calculateScore()
    setScore(newScore)
    setSubmitted(true)

    try {
      const result = await saveActivityProgress({
        userId,
        activityId: activity.id,
        isCompleted: true,
        score: newScore,
        answers: JSON.stringify(userMatches),
        timeSpent: 0,
      })

      if (!result.success) throw new Error(result.error || "Failed to save progress")

      toast({
        title: "Activity completed",
        description: "Your progress has been saved successfully.",
      })

      router.refresh()
    } catch (error: any) {
      console.error("Error saving progress:", error)
      toast({
        title: "Error saving progress",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetActivity = () => {
    setLines([])
    setUserMatches({})
    setSelectedTerm(null)
  }

  const allTermsMatched = Object.keys(userMatches).length === terms.length

  if (!activity?.content?.pairs || activity.content.pairs.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No matching pairs available for this activity.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {allActivitiesCompleted && submitted && (
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
        <h3 className="text-xl font-semibold mb-2">{activity.content.title}</h3>
        <p className="text-muted-foreground mb-4">{activity.content.instructions}</p>
      </div>

      <div ref={containerRef} className="relative">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Terms</h4>
              <div className="space-y-2">
                {terms.map((term) => {
                  const isSelected = selectedTerm === term.id
                  const isMatched = userMatches[term.id] !== undefined
                  const isCorrect = submitted && userMatches[term.id] === term.id

                  return (
                    <div
                      key={term.id}
                      id={`term-${term.id}`}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/20 border-primary"
                          : isMatched
                          ? "bg-muted"
                          : "bg-background hover:bg-muted/50"
                      } ${
                        submitted && isCorrect
                          ? "border-green-500"
                          : submitted && !isCorrect
                          ? "border-red-500"
                          : ""
                      }`}
                      onClick={() => handleTermClick(term.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{term.content}</span>
                        {submitted &&
                          (isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Matches</h4>
              <div className="space-y-2">
                {matches.map((match) => {
                  const isMatched = Object.values(userMatches).includes(match.id)
                  const matchingTermId = Object.entries(userMatches).find(([_, matchId]) => matchId === match.id)?.[0]
                  const isCorrect = submitted && matchingTermId === match.id

                  return (
                    <div
                      key={match.id}
                      id={`match-${match.id}`}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        isMatched ? "bg-muted" : "bg-background hover:bg-muted/50"
                      } ${
                        submitted && isCorrect
                          ? "border-green-500"
                          : submitted && !isCorrect
                          ? "border-red-500"
                          : ""
                      }`}
                      onClick={() => handleMatchClick(match.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{match.content}</span>
                        {submitted &&
                          (matchingTermId === match.id ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : matchingTermId ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {!submitted ? (
            <Button onClick={handleSubmit} className="w-full mt-6" disabled={isSaving}>
              {isSaving ? "Submitting..." : "Submit Answers"}
            </Button>
          ) : (
            <div className="bg-muted p-4 rounded-md text-center mt-6">
              <p className="text-lg font-semibold">Your score: {score} out of 100</p>
              <p className="text-muted-foreground">
                {score === 100
                  ? "Perfect! Great job!"
                  : score > 70
                    ? "Good job! Keep practicing!"
                    : "Keep practicing to improve your score!"}
              </p>
            </div>
          )}
      </div>

    </div>
  )
}
