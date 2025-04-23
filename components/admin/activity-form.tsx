"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { v4 as uuidv4 } from 'uuid';

interface ActivityFormProps {
  courses: { id: string; title: string }[]
  activity?: any
  initialCourseId?: string
  initialOrderIndex?: number
}

export default function ActivityForm({ courses, activity, initialCourseId, initialOrderIndex }: ActivityFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const isEditing = !!activity

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [title, setTitle] = useState(activity?.title || "")
  const [description, setDescription] = useState(activity?.description || "")
  const [courseId, setCourseId] = useState(activity?.course_id || initialCourseId || "")
  const [activityType, setActivityType] = useState(activity?.type || "reading")
  const [status, setStatus] = useState(activity?.status || "draft")
  const [orderIndex, setOrderIndex] = useState(activity?.order_index || initialOrderIndex || 1)
  const [content, setContent] = useState<any>(null)

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize content based on activity type
  useEffect(() => {
    if (activity?.content) {
      setContent(activity.content)
    } else {
      setContent(generateContentTemplate(activityType))
    }
  }, [activity, activityType])

  // Generate content template based on activity type
  const generateContentTemplate = (type: string) => {
    switch (type) {
      case "reading":
        return {
          text: "Enter the reading text here...",
          questions: [
            {
              question: "Sample question 1?",
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              correctAnswer: "Option 1",
            },
          ],
        }
      case "listening":
        return {
          audioUrl: "",
          transcript: "Enter the transcript here...",
          questions: [
            {
              question: "Sample question 1?",
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              correctAnswer: "Option 1",
            },
          ],
        }
      case "quiz":
        return {
          questions: [
            {
              question: "Sample question 1?",
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              correctAnswer: "Option 1",
            },
          ],
        }
      case "fill_blank":
        return {
          title: "Fill in the Blanks Exercise",
          instructions: "Fill in the blanks with the correct words.",
          sentences: [
            { id: uuidv4(), text: "The cat sat on the _____.", answer: "mat" },
            { id: uuidv4(), text: "I like to eat _____ for breakfast.", answer: "cereal" },
          ],
        }
      case "video":
        return {
          videoId: "dQw4w9WgXcQ",
          title: "Video Title",
          description: "Video description goes here...",
          questions: [
            {
              id: uuidv4(),
              text: "Sample question 1?",
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              correct: "Option 1",
            },
          ],
        }
      case "drag_drop":
        return {
          title: "Drag and Drop Exercise",
          instructions: "Drag the items on the left and drop them on their matching items on the right.",
          pairs: [
            { id: uuidv4(), term: "Term 1", match: "Definition 1" },
            { id: uuidv4(), term: "Term 2", match: "Definition 2" },
          ],
        }
      case "match_lines":
        return {
          title: "Match with Lines Exercise",
          instructions: "Click on a term and then click on its matching definition to connect them with a line.",
          pairs: [
            { id: uuidv4(), term: "Term 1", match: "Definition 1" },
            { id: uuidv4(), term: "Term 2", match: "Definition 2" },
          ],
        }
      case "flip_cards":
        return {
          title: "Flip Card Matching Exercise",
          instructions: "Flip cards to find matching pairs of terms and definitions.",
          pairs: [
            { id: uuidv4(), term: "Term 1", match: "Definition 1" },
            { id: uuidv4(), term: "Term 2", match: "Definition 2" },
          ],
        }
      default:
        return {}
    }
  }

  // Handle type change
  const handleTypeChange = (newType: string) => {
    setActivityType(newType)

    // Only reset content if it's a new activity or if the type has changed
    if (!isEditing || (isEditing && newType !== activity?.type)) {
      setContent(generateContentTemplate(newType))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    } else if (title.length < 3) {
      newErrors.title = "Title must be at least 3 characters"
    }

    if (!description.trim()) {
      newErrors.description = "Description is required"
    } else if (description.length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    if (!courseId) {
      newErrors.courseId = "Please select a course"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing) {
        // Update existing activity
        const { error } = await supabase
          .from("activities")
          .update({
            title,
            description,
            course_id: courseId,
            type: activityType,
            status,
            order_index: orderIndex,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activity.id)

        if (error) throw error
      } else {
        // Create new activity
        const { error } = await supabase.from("activities").insert({
          title,
          description,
          course_id: courseId,
          type: activityType,
          status,
          order_index: orderIndex,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
      }

      toast({
        title: isEditing ? "Activity updated" : "Activity created",
        description: isEditing
          ? "The activity has been updated successfully."
          : "The activity has been created successfully.",
      })

      // Redirect to appropriate page
      if (status === "published") {
        router.push("/dashboard/admin/activities/reorder")
      } else {
        router.push("/dashboard/admin?tab=activities")
      }
    } catch (error: any) {
      console.error("Error submitting activity:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving the activity.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a question/item
  const addItem = () => {
    const newContent = { ...content }

    if (activityType === "quiz") {
      if (!newContent.questions) newContent.questions = []
      newContent.questions.push({
        id: `qz${uuidv4()}`,
        question: `Question ${newContent.questions.length + 1}?`,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: "Option 1",
      })
    } else if (activityType === "listening") {
      if (!newContent.questions) newContent.questions = []
      newContent.questions.push({
        id: `l${uuidv4()}`,
        question: `Question ${newContent.questions.length + 1}?`,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: "Option 1",
      })
    } else if (activityType === "reading") {
      if (!newContent.questions) newContent.questions = []
      newContent.questions.push({
        id: `r${uuidv4()}`,
        question: `Question ${newContent.questions.length + 1}?`,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: "Option 1",
      })
    } else if (activityType === "video") {
      if (!newContent.questions) newContent.questions = []
      newContent.questions.push({
        id: `q${uuidv4()}`,
        text: `Question ${newContent.questions.length + 1}?`,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct: "Option 1",
      })
    } else if (activityType === "fill_blank") {
      if (!newContent.sentences) newContent.sentences = []
      newContent.sentences.push({
        id: `s${uuidv4()}`,
        text: "This is a new _____ with a blank.",
        answer: "sentence",
      })
    } else if (["drag_drop", "match_lines", "flip_cards"].includes(activityType)) {
      if (!newContent.pairs) newContent.pairs = []
      newContent.pairs.push({
        id: `p${uuidv4()}`,
        term: `Term ${newContent.pairs.length + 1}`,
        match: `Definition ${newContent.pairs.length + 1}`,
      })
    }

    setContent(newContent)
  }

  // Remove an item
  const removeItem = (index: number) => {
    const newContent = { ...content }

    if (activityType === "quiz" || activityType === "reading" || activityType === "listening") {
      newContent.questions.splice(index, 1)
    } else if (activityType === "video") {
      newContent.questions.splice(index, 1)
    } else if (activityType === "fill_blank") {
      newContent.sentences.splice(index, 1)
    } else if (["drag_drop", "match_lines", "flip_cards"].includes(activityType)) {
      newContent.pairs.splice(index, 1)
    }

    setContent(newContent)
  }

  // Update a field in content
  const updateField = (field: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [field]: value }))
  }

  // Update a nested field
  const updateNestedField = (index: number, field: string, value: any) => {
    const newContent = { ...content }

    if (activityType === "quiz" || activityType === "reading" || activityType === "listening") {
      if (newContent.questions && newContent.questions[index]) {
        newContent.questions[index][field] = value
      }
    } else if (activityType === "video") {
      if (newContent.questions && newContent.questions[index]) {
        newContent.questions[index][field] = value
      }
    } else if (activityType === "fill_blank") {
      if (newContent.sentences && newContent.sentences[index]) {
        newContent.sentences[index][field] = value
      }
    } else if (["drag_drop", "match_lines", "flip_cards"].includes(activityType)) {
      if (newContent.pairs && newContent.pairs[index]) {
        newContent.pairs[index][field] = value
      }
    }

    setContent(newContent)
  }

  // Update an option in multiple choice
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newContent = { ...content }

    if (
      (activityType === "quiz" || activityType === "reading" || activityType === "listening") &&
      newContent.questions &&
      newContent.questions[questionIndex] &&
      newContent.questions[questionIndex].options
    ) {
      newContent.questions[questionIndex].options[optionIndex] = value
    } else if (
      activityType === "video" &&
      newContent.questions &&
      newContent.questions[questionIndex] &&
      newContent.questions[questionIndex].options
    ) {
      newContent.questions[questionIndex].options[optionIndex] = value
    }

    setContent(newContent)
  }

  // Set correct answer
  const setCorrectAnswer = (questionIndex: number, option: string) => {
    const newContent = { ...content }

    if (
      (activityType === "quiz" || activityType === "reading" || activityType === "listening") &&
      newContent.questions &&
      newContent.questions[questionIndex]
    ) {
      newContent.questions[questionIndex].correctAnswer = option
    } else if (activityType === "video" && newContent.questions && newContent.questions[questionIndex]) {
      newContent.questions[questionIndex].correct = option
    }

    setContent(newContent)
  }

  // Update JSON content directly
  const updateJsonContent = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      setContent(parsed)
    } catch (error) {
      console.error("Invalid JSON:", error)
      // Don't update if JSON is invalid
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="content">Content Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Activity title" />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {errors.courseId && <p className="text-sm text-red-500">{errors.courseId}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Activity description"
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
                <option value="quiz">Multiple Choice</option>
                <option value="fill_blank">Fill in the Blanks</option>
                <option value="video">Video</option>
                <option value="drag_drop">Drag and Drop</option>
                <option value="match_lines">Match with Lines</option>
                <option value="flip_cards">Flip Cards</option>
              </select>
              <p className="text-sm text-muted-foreground">
                This determines the type of activity and its content structure.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="text-sm text-muted-foreground">Draft activities are not visible to students.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Order Index</label>
              <Input
                type="number"
                min="1"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground">Determines the order of activities in a course.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Editor</CardTitle>
              <CardDescription>Edit the content for this {activityType.replace("_", " ")} activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reading Activity Content */}
              {activityType === "reading" && content && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Reading Text
                    </label>
                    <Textarea
                      rows={6}
                      value={content.text || ""}
                      onChange={(e) => updateField("text", e.target.value)}
                      placeholder="Enter the reading text here..."
                      className="mt-1.5"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Questions
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Question
                      </Button>
                    </div>

                    {content.questions?.map((question: any, qIndex: number) => (
                      <Card key={qIndex} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <label className="text-base font-medium">Question {qIndex + 1}</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(qIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Question Text
                            </label>
                            <Input
                              value={question.question || ""}
                              onChange={(e) => updateNestedField(qIndex, "question", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Options
                            </label>
                            <div className="space-y-2 mt-1.5">
                              {question.options?.map((option: string, oIndex: number) => (
                                <div key={oIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  />
                                  <div className="w-[120px]">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        checked={question.correctAnswer === option}
                                        onChange={() => setCorrectAnswer(qIndex, option)}
                                        className="h-4 w-4"
                                      />
                                      <span>Correct</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Listening Activity Content */}
              {activityType === "listening" && content && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Audio URL
                    </label>
                    <Input
                      value={content.audioUrl || ""}
                      onChange={(e) => updateField("audioUrl", e.target.value)}
                      placeholder="Enter the audio URL here..."
                      className="mt-1.5"
                    />
                    <p className="text-sm text-muted-foreground mt-1.5">Enter a direct URL to an MP3 audio file</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Transcript
                    </label>
                    <Textarea
                      rows={6}
                      value={content.transcript || ""}
                      onChange={(e) => updateField("transcript", e.target.value)}
                      placeholder="Enter the transcript here..."
                      className="mt-1.5"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Questions
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Question
                      </Button>
                    </div>

                    {content.questions?.map((question: any, qIndex: number) => (
                      <Card key={qIndex} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <label className="text-base font-medium">Question {qIndex + 1}</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(qIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Question Text
                            </label>
                            <Input
                              value={question.question || ""}
                              onChange={(e) => updateNestedField(qIndex, "question", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Options
                            </label>
                            <div className="space-y-2 mt-1.5">
                              {question.options?.map((option: string, oIndex: number) => (
                                <div key={oIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  />
                                  <div className="w-[120px]">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        checked={question.correctAnswer === option}
                                        onChange={() => setCorrectAnswer(qIndex, option)}
                                        className="h-4 w-4"
                                      />
                                      <span>Correct</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiple Choice Quiz Content */}
              {activityType === "quiz" && content && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Questions
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" /> Add Question
                    </Button>
                  </div>

                  {content.questions?.map((question: any, qIndex: number) => (
                    <Card key={qIndex} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <label className="text-base font-medium">Question {qIndex + 1}</label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(qIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Question Text
                          </label>
                          <Input
                            value={question.question || ""}
                            onChange={(e) => updateNestedField(qIndex, "question", e.target.value)}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Options
                          </label>
                          <div className="space-y-2 mt-1.5">
                            {question.options?.map((option: string, oIndex: number) => (
                              <div key={oIndex} className="flex gap-2">
                                <Input value={option} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} />
                                <div className="w-[120px]">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      checked={question.correctAnswer === option}
                                      onChange={() => setCorrectAnswer(qIndex, option)}
                                      className="h-4 w-4"
                                    />
                                    <span>Correct</span>
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Fill in the Blanks Content */}
              {activityType === "fill_blank" && content && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Title
                    </label>
                    <Input
                      value={content.title || ""}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Instructions
                    </label>
                    <Textarea
                      value={content.instructions || ""}
                      onChange={(e) => updateField("instructions", e.target.value)}
                      className="mt-1.5"
                    />
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Example: "Fill in the blanks with the correct past simple form of the verbs in brackets"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Sentences
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Sentence
                      </Button>
                    </div>

                    {content.sentences?.map((sentence: any, sIndex: number) => (
                      <Card key={sIndex} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <label className="text-base font-medium">Sentence {sIndex + 1}</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(sIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Sentence Text (use _____ for blanks)
                            </label>
                            <Textarea
                              value={sentence.text || ""}
                              onChange={(e) => updateNestedField(sIndex, "text", e.target.value)}
                              className="mt-1.5"
                            />
                            <p className="text-sm text-muted-foreground mt-1.5">
                              Use _____ (5 underscores) for each blank. Example: "The cat _____ on the mat."
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Answer
                            </label>
                            <Input
                              value={sentence.answer || ""}
                              onChange={(e) => updateNestedField(sIndex, "answer", e.target.value)}
                              className="mt-1.5"
                            />
                            <p className="text-sm text-muted-foreground mt-1.5">
                              For multiple blanks, separate answers with commas. Example: "sat, slept"
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Activity Content */}
              {activityType === "video" && content && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      YouTube Video ID
                    </label>
                    <Input
                      value={content.videoId || ""}
                      onChange={(e) => updateField("videoId", e.target.value)}
                      className="mt-1.5"
                    />
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Enter just the ID part from a YouTube URL (e.g., "dQw4w9WgXcQ" from
                      https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Title
                    </label>
                    <Input
                      value={content.title || ""}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Description
                    </label>
                    <Textarea
                      value={content.description || ""}
                      onChange={(e) => updateField("description", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Questions
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Question
                      </Button>
                    </div>

                    {content.questions?.map((question: any, qIndex: number) => (
                      <Card key={qIndex} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <label className="text-base font-medium">Question {qIndex + 1}</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(qIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Question Text
                            </label>
                            <Input
                              value={question.text || ""}
                              onChange={(e) => updateNestedField(qIndex, "text", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Options
                            </label>
                            <div className="space-y-2 mt-1.5">
                              {question.options?.map((option: string, oIndex: number) => (
                                <div key={oIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  />
                                  <div className="w-[120px]">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        checked={question.correct === option}
                                        onChange={() => setCorrectAnswer(qIndex, option)}
                                        className="h-4 w-4"
                                      />
                                      <span>Correct</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Drag and Drop Content */}
              {activityType === "drag_drop" && content && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Title
                    </label>
                    <Input
                      value={content.title || ""}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Instructions
                    </label>
                    <Textarea
                      value={content.instructions || ""}
                      onChange={(e) => updateField("instructions", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Pairs
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Pair
                      </Button>
                    </div>

                    {content.pairs?.map((pair: any, pIndex: number) => (
                      <Card key={pIndex} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <label className="text-base font-medium">Pair {pIndex + 1}</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(pIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Term
                            </label>
                            <Input
                              value={pair.term || ""}
                              onChange={(e) => updateNestedField(pIndex, "term", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Match
                            </label>
                            <Input
                              value={pair.match || ""}
                              onChange={(e) => updateNestedField(pIndex, "match", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Lines Content */}
              {activityType === "match_lines" && content && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Title
                    </label>
                    <Input
                      value={content.title || ""}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Instructions
                    </label>
                    <Textarea
                      value={content.instructions || ""}
                      onChange={(e) => updateField("instructions", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Pairs
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Pair
                      </Button>
                    </div>

                    {content.pairs?.map((pair: any, pIndex: number) => (
                      <Card key={pIndex} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <label className="text-base font-medium">Pair {pIndex + 1}</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(pIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Term
                            </label>
                            <Input
                              value={pair.term || ""}
                              onChange={(e) => updateNestedField(pIndex, "term", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Match
                            </label>
                            <Input
                              value={pair.match || ""}
                              onChange={(e) => updateNestedField(pIndex, "match", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Flip Cards Content */}
              {activityType === "flip_cards" && content && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Title
                    </label>
                    <Input
                      value={content.title || ""}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Instructions
                    </label>
                    <Textarea
                      value={content.instructions || ""}
                      onChange={(e) => updateField("instructions", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Pairs
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Pair
                      </Button>
                    </div>

                    {content.pairs?.map((pair: any, pIndex: number) => (
                      <Card key={pIndex} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <label className="text-base font-medium">Pair {pIndex + 1}</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(pIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Term
                            </label>
                            <Input
                              value={pair.term || ""}
                              onChange={(e) => updateNestedField(pIndex, "term", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Match
                            </label>
                            <Input
                              value={pair.match || ""}
                              onChange={(e) => updateNestedField(pIndex, "match", e.target.value)}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON Editor */}
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Raw JSON Content
                  </label>
                  <Textarea
                    rows={10}
                    value={JSON.stringify(content, null, 2)}
                    onChange={(e) => updateJsonContent(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    Edit the JSON content directly. Be careful to maintain valid JSON format.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? "Updating..." : "Creating..."}
          </>
        ) : isEditing ? (
          "Update Activity"
        ) : (
          "Create Activity"
        )}
      </Button>
    </form>
  )
}
