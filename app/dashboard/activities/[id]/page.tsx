import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"

// Import activity components
import ReadingActivity from "@/components/activities/reading-activity"
import ListeningActivity from "@/components/activities/listening-activity"
import MultipleChoiceActivity from "@/components/activities/multiple-choice-activity"
import FillBlanksActivity from "@/components/activities/fill-blanks-activity"
import VideoActivity from "@/components/activities/video-activity"
import DragDropActivity from "@/components/activities/drag-drop-activity"
import MatchLinesActivity from "@/components/activities/match-lines-activity"
import FlipCardsActivity from "@/components/activities/flip-cards-activity"

export const metadata: Metadata = {
  title: "Activity | English Learning Platform",
  description: "Complete this activity to improve your English skills",
}

export default async function ActivityPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/activities/" + params.id)
  }

  const userId = session.user.id

  // Fetch activity details
  const { data: activity, error } = await supabase
    .from("activities")
    .select(
      `
      *,
      courses:course_id (
        title
      )
    `,
    )
    .eq("id", params.id)
    .single()

  if (error || !activity) {
    console.error("Error fetching activity:", error)
    notFound()
  }

  // Log the activity for debugging
  console.log("Activity found:", activity)

  // Fetch user progress for this activity
  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("activity_id", params.id)
    .single()

  if (progressError && progressError.code !== "PGRST116") {
    console.error("Error fetching progress:", progressError)
  }

  // Fetch user progress for this course
  const { data: courseProgress, error: courseProgressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", activity.course_id)

  // Fetch next and previous activities in the same course
  const { data: courseActivities, error: courseActivitiesError } = await supabase
    .from("activities")
    .select("id, title, order_index")
    .eq("course_id", activity.course_id)
    .eq("status", "published")
    .order("order_index", { ascending: true })

  if (courseActivitiesError) {
    console.error("Error fetching course activities:", courseActivitiesError)
  }

  // Find current activity index
  const currentIndex = courseActivities?.findIndex((a) => a.id === params.id) || 0
  const prevActivity = currentIndex > 0 ? courseActivities?.[currentIndex - 1] : null
  const nextActivity = currentIndex < (courseActivities?.length || 0) - 1 ? courseActivities?.[currentIndex + 1] : null
  const isLastActivity = !nextActivity
  const isAllActivitiesCompleted = courseActivities.length === courseProgress.length

  // Render the appropriate activity component based on type
  const renderActivity = () => {
    // Log the activity type for debugging
    console.log("Activity type:", activity.type)

    switch (activity.type) {
      case "reading":
        return (
          <ReadingActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      case "listening":
        return (
          <ListeningActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      case "quiz":
        return (
          <MultipleChoiceActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      case "fill_blank":
        return (
          <FillBlanksActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      case "drag_drop":
        return (
          <DragDropActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      case "match_lines":
        return (
          <MatchLinesActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      case "video":
        return (
          <VideoActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      case "flip_cards":
        return (
          <FlipCardsActivity
            activity={activity}
            isCompleted={progress?.is_completed}
            userAnswer={progress?.answers}
            isLastActivity={isLastActivity}
            allActivitiesCompleted={isAllActivitiesCompleted}
            courseId={activity.course_id}
            nextActivityId={nextActivity?.id}
            progress={progress}
            userId={userId}
          />
        )
      default:
        return (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Unsupported Activity Type</h3>
            <p className="text-yellow-700">
              This activity type ({activity.type}) is not currently supported. Please contact the administrator.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{activity.title}</h1>
          <Link href={`/dashboard/courses/${activity.course_id}`}>
            <Button variant="outline" size="sm">
              Back to Course
            </Button>
          </Link>
        </div>
        <p className="text-muted-foreground">
          Course: <Link href={`/dashboard/courses/${activity.course_id}`}>{activity.courses?.title || "Course"}</Link>
        </p>
      </div>

      {renderActivity()}

      <div className="flex justify-between mt-8">
        {prevActivity ? (
          <Link href={`/dashboard/activities/${prevActivity.id}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Previous Activity
            </Button>
          </Link>
        ) : (
          <div></div>
        )}

        {progress?.answers && nextActivity && (
          <Link href={`/dashboard/activities/${nextActivity.id}`}>
            <Button variant="outline" className="flex items-center gap-2">
              Next Activity
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
