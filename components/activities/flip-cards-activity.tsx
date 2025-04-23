"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { saveActivityProgress } from "@/app/actions/activity-actions"
import { useToast } from "@/components/ui/use-toast"
import { Shuffle, Trophy } from "lucide-react"

interface FlipCardsActivityProps {
  activity: any
  progress?: any
  isLastActivity?: boolean
  allActivitiesCompleted?: boolean
  courseId?: string
  nextActivityId?: string
  userId: string
}

export default function FlipCardsActivity({
  activity,
  userId,
  progress,
  isLastActivity = false,
  courseId,
  nextActivityId,
  allActivitiesCompleted = false,
}: FlipCardsActivityProps) {
  const [cards, setCards] = useState<any[]>([])
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [wrongMoves, setWrongMoves] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (activity?.content?.pairs) {
      initializeGame()
    }
  }, [activity])

  useEffect(() => {
    if (progress?.completed) {
      setGameCompleted(true)
      setIsCompleted(true)
      setScore(progress.score || 0)

      if (progress.answers) {
        try {
          const answersData = typeof progress.answers === "string" ? JSON.parse(progress.answers) : progress.answers
          if (answersData.matchedPairs) {
            setMatchedPairs(answersData.matchedPairs)
          }
        } catch (error) {
          console.error("Error parsing progress answers:", error)
        }
      }
    }
  }, [progress])

  const initializeGame = () => {
    const cardPairs: any[] = []

    activity.content.pairs.forEach((pair: any) => {
      cardPairs.push({
        id: `term-${pair.id}`,
        content: pair.term,
        pairId: pair.id,
        type: "term",
      })
      cardPairs.push({
        id: `match-${pair.id}`,
        content: pair.match,
        pairId: pair.id,
        type: "match",
      })
    })

    setCards(shuffle(cardPairs))
    setFlippedIndexes([])
    setMatchedPairs([])
    setMoves(0)
    setWrongMoves(0)
    setGameCompleted(false)
  }

  const shuffle = (array: any[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const handleCardClick = (index: number) => {
    if (gameCompleted || matchedPairs.includes(cards[index].pairId)) return
    if (flippedIndexes.length === 2 || flippedIndexes.includes(index)) return

    const newFlippedIndexes = [...flippedIndexes, index]
    setFlippedIndexes(newFlippedIndexes)

    if (newFlippedIndexes.length === 2) {
      const [firstIndex, secondIndex] = newFlippedIndexes
      setMoves((prev) => prev + 1)

      const firstCard = cards[firstIndex]
      const secondCard = cards[secondIndex]

      if (
        firstCard.pairId === secondCard.pairId &&
        firstCard.type !== secondCard.type
      ) {
        setMatchedPairs([...matchedPairs, firstCard.pairId])
        setTimeout(() => setFlippedIndexes([]), 500)

        if (matchedPairs.length + 1 === activity.content.pairs.length) {
          handleGameComplete()
        }
      } else {
        setWrongMoves((prev) => prev + 1)
        setTimeout(() => setFlippedIndexes([]), 1000)
      }
    }
  }

  const handleGameComplete = async () => {
    setGameCompleted(true)

    const penalty = Math.floor(wrongMoves / 3) * 5
    const finalScore = Math.max(0, 100 - penalty)
    setScore(finalScore)

    if (!userId || !activity?.id) {
      toast({
        title: "Error saving progress",
        description: "Missing required parameters. Please try again or contact support.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const result = await saveActivityProgress({
        userId,
        activityId: activity.id,
        isCompleted: true,
        score: finalScore,
        answers: JSON.stringify({ matchedPairs, moves, wrongMoves }),
      })

      if (!result.success) throw new Error(result.error || "Failed to save progress")

      toast({
        title: "Activity completed!",
        description: `Great job! You completed the activity with a score of ${finalScore}/100.`,
      })

      setIsCompleted(true)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error saving progress",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetGame = () => {
    initializeGame()
  }

  if (!activity?.content?.pairs || activity.content.pairs.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No matching pairs available for this activity.</p>
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
        <h3 className="text-xl font-semibold mb-2">{activity.content.title || "Flip Cards Activity"}</h3>
        <p className="text-muted-foreground mb-4">
          {activity.content.instructions || "Flip cards to find matching pairs of terms and definitions."}
        </p>
      </div>

      {gameCompleted ? (
        <div className="text-center p-6 bg-muted rounded-lg">
          <h3 className="text-2xl font-bold mb-2">Activity Completed!</h3>
          <p className="text-xl font-semibold mb-6">Score: {score}/100</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="font-medium">Moves: {moves}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`aspect-[3/4] perspective-1000 cursor-pointer ${
                  matchedPairs.includes(card.pairId) ? "opacity-60" : ""
                }`}
                onClick={() => handleCardClick(index)}
              >
                <div
                  className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                    flippedIndexes.includes(index) || matchedPairs.includes(card.pairId) ? "rotate-y-180" : ""
                  }`}
                >
                  <div className="absolute w-full h-full backface-hidden bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-xl font-bold">
                    ?
                  </div>
                  <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-card border rounded-lg p-4 flex items-center justify-center text-center">
                    <span className="text-sm">{card.content}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
