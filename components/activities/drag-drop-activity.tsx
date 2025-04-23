"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { saveActivityProgress } from "@/app/actions/activity-actions"
import { useToast } from "@/components/ui/use-toast"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { CheckCircle, XCircle, X } from "lucide-react"

interface DragDropActivityProps {
  activity: any
  progress?: any
  isLastActivity?: boolean
  courseId?: string
  nextActivityId?: string
  userId: string
}

export default function DragDropActivity({
  activity,
  progress,
  isLastActivity = false,
  courseId,
  nextActivityId,
  userId,
}: DragDropActivityProps) {
  const [terms, setTerms] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [assignedMatches, setAssignedMatches] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(progress?.completed || false)
  const [score, setScore] = useState(progress?.score || 0)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (activity.content?.pairs) {
      const termItems = activity.content.pairs.map((pair: any) => ({
        id: `term-${pair.id}`,
        content: pair.term,
        originalId: pair.id,
      }))

      const matchItems = activity.content.pairs.map((pair: any) => ({
        id: `match-${pair.id}`,
        content: pair.match,
        originalId: pair.id,
      }))

      setTerms(shuffle(termItems))
      setMatches(shuffle(matchItems))
    }
  }, [activity])

  useEffect(() => {
    if (progress?.completed && progress.answers) {
      const progressAnswersObj = progress?.answers ? JSON.parse(progress?.answers) : undefined
      setAssignedMatches(progressAnswersObj)
      setSubmitted(true)
      setScore(progress.score || 0)
    }
  }, [progress])

  const shuffle = (array: any[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const handleDragEnd = (result: any) => {
    const { source, destination } = result
    if (!destination || source.droppableId === destination.droppableId) return

    const draggedTerm = terms[source.index]
    const matchId = destination.droppableId

    const newAssigned = { ...assignedMatches }
    const existingMatchKey = Object.keys(newAssigned).find(
      (key) => newAssigned[key]?.id === draggedTerm.id
    )

    if (existingMatchKey) delete newAssigned[existingMatchKey]
    newAssigned[matchId] = draggedTerm

    const newTerms = [...terms]
    newTerms.splice(source.index, 1)
    setTerms(newTerms)
    setAssignedMatches(newAssigned)
  }

  const handleRemoveAssignment = (matchId: string) => {
    const newAssigned = { ...assignedMatches }
    const term = newAssigned[matchId]
    if (term) {
      setTerms([...terms, term])
    }
    delete newAssigned[matchId]
    setAssignedMatches(newAssigned)
  }

  const calculateScore = () => {
    let correct = 0
    const total = activity.content.pairs.length
    matches.forEach((match) => {
      const assignedTerm = assignedMatches[match.id]
      if (assignedTerm && assignedTerm.originalId === match.originalId) {
        correct++
      }
    })
    return Math.round((correct / total) * 100)
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    const newScore = calculateScore()
    setScore(newScore)
    setSubmitted(true)

    const answers: Record<string, string> = {}
    Object.entries(assignedMatches).forEach(([matchId, term]) => {
      answers[term.originalId] = matches.find((m) => m.id === matchId)?.originalId
    })

    try {
      const result = await saveActivityProgress({
        userId,
        activityId: activity.id,
        isCompleted: true,
        score: newScore,
        answers: JSON.stringify(answers),
      })

      if (!result.data) throw new Error(result.error || "Failed to save progress")

      toast({ title: "Activity completed", description: "Your progress has been saved successfully." })
      router.refresh()
    } catch (error: any) {
      toast({ title: "Error saving progress", description: error.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (!activity.content?.pairs || activity.content.pairs.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">No matching pairs available for this activity.</div>
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">Results</h3>
            <div className="text-4xl font-bold mb-6 text-center">{score} / 100</div>
            <div className="space-y-4">
              {activity.content.pairs.map((pair: any) => {
                const isCorrect = Object.values(assignedMatches).find(
                  (term) => term.originalId === pair.id && pair.id === pair.id
                )
                return (
                  <div key={pair.id} className="flex items-center space-x-2 p-2 rounded-md border">
                    <div className="flex-1">{pair.term}</div>
                    <div className="flex items-center">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-2" />
                      )}
                    </div>
                    <div className="flex-1">{pair.match}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">{activity.content.title}</h3>
        <p className="text-muted-foreground mb-4">{activity.content.instructions}</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Terms</h4>
              <Droppable droppableId="terms">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[200px] space-y-2">
                    {terms.map((term, index) => (
                      <Draggable key={term.id} draggableId={term.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="p-3 bg-background border rounded-md shadow-sm">
                            {term.content}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {terms.length === 0 && <div className="text-muted-foreground text-center">All terms matched</div>}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Matches</h4>
              <div className="space-y-3">
                {matches.map((match) => (
                  <Droppable key={match.id} droppableId={match.id} isDropDisabled={!!assignedMatches[match.id]}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`p-3 border rounded-md min-h-[48px] flex items-center justify-between ${snapshot.isDraggingOver ? "bg-muted" : "bg-background"}`}>
                        {assignedMatches[match.id] ? (
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Match:</span> <span>{match.content}</span>
                              <button onClick={() => handleRemoveAssignment(match.id)} className="ml-2 text-destructive"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="font-semibold">Term:</span> <span className="ml-1">{assignedMatches[match.id].content}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{match.content}</span>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DragDropContext>

      <div className="flex justify-between">
        <Button className="w-full" onClick={handleSubmit} disabled={terms.length !== 0 || isSaving}>
          {isSaving ? "Saving..." : "Submit Answers"}
        </Button>
      </div>
    </div>
  )
}
