"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveActivityProgress({
  userId,
  activityId,
  isCompleted,
  score,
  answers,
  timeSpent,
}: {
  userId: string
  activityId: string
  isCompleted: boolean
  score: number
  answers: string | Record<string, string>
  timeSpent: number
}) {
  // Validate required parameters
  if (!userId || !activityId) {
    console.error("Missing required parameters:", { userId, activityId })
    return { success: false, error: "Missing required parameters" }
  }

  const supabase = await createClient()

  try {
    // Convert answers to string if it's an object
    const answersString = typeof answers === "object" ? JSON.stringify(answers) : answers

    // Check if progress already exists
    const { data: existingProgress, error: fetchError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("activity_id", activityId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching existing progress:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Get the course_id for this activity
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("course_id")
      .eq("id", activityId)
      .single()

    if (activityError) {
      console.error("Error fetching activity:", activityError)
      return { success: false, error: activityError.message }
    }

    const courseId = activity.course_id
    const _timeSpent = timeSpent || 0 

    if (existingProgress) {
      // Update existing progress
      const { error: updateError } = await supabase
        .from("user_progress")
        .update({
          completed: isCompleted,
          score: score,
          answers: answersString,
          time_spent: existingProgress.time_spent + _timeSpent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id)

      if (updateError) {
        console.error("Error updating activity progress:", updateError)
        return { success: false, error: updateError.message }
      }
    } else {
      // Insert new progress
      const { error: insertError } = await supabase.from("user_progress").insert({
        user_id: userId,
        activity_id: activityId,
        course_id: courseId,
        completed: isCompleted,
        score: score,
        answers: answersString,
        time_spent: _timeSpent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error saving activity progress:", insertError)
        return { success: false, error: insertError.message }
      }
    }

    // Update course progress
    await updateCourseProgress(userId, courseId, supabase)

    // Revalidate relevant paths
    revalidatePath(`/dashboard/activities/${activityId}`)
    revalidatePath(`/dashboard/courses/${courseId}`)
    revalidatePath("/dashboard/progress")

    return { success: true }
  } catch (error: any) {
    console.error("Error in saveActivityProgress:", error)
    return { success: false, error: error.message }
  }
}

async function updateCourseProgress(userId: string, courseId: string, supabase: any) {
  try {
    // Get all published activities for the course
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select("id")
      .eq("course_id", courseId)
      .eq("status", "published")

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
      return
    }

    if (!activities || activities.length === 0) {
      console.log("No published activities found for course:", courseId)
      return
    }

    // Get completed activities for the user in this course
    const { data: completedActivities, error: completedError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true)

    if (completedError) {
      console.error("Error fetching completed activities:", completedError)
      return
    }

    // Calculate progress percentage as an integer (0-100)
    const totalActivities = activities.length
    const completedCount = completedActivities?.length || 0
    const progressPercentage = Math.round((completedCount / totalActivities) * 100)

    // Calculate average score with 2 decimal places
    let totalScore = 0
    if (completedActivities && completedActivities.length > 0) {
      totalScore = completedActivities.reduce((sum, activity) => sum + (activity.score || 0), 0)
    }
    const averageScore = completedCount > 0 ? Math.round((totalScore / completedCount) * 100) / 100 : 0

    // Check if user is already enrolled in the course
    const { data: existingUserCourse, error: userCourseError } = await supabase
      .from("user_courses")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single()

    if (userCourseError && userCourseError.code !== "PGRST116") {
      console.error("Error fetching user course:", userCourseError)
    }

    const userCourseData = {
      // Ensure progress is an integer
      progress: Math.round(progressPercentage),
      // Ensure score is an integer if the database expects it
      score: Math.round(averageScore),
      updated_at: new Date().toISOString(),
    }

    if (existingUserCourse) {
      // Update existing enrollment
      const { error: updateError } = await supabase
        .from("user_courses")
        .update(userCourseData)
        .eq("id", existingUserCourse.id)

      if (updateError) {
        console.error("Error updating user course:", updateError)
      }
    } else {
      // Create new enrollment
      const { error: insertError } = await supabase.from("user_courses").insert({
        user_id: userId,
        course_id: courseId,
        progress: Math.round(progressPercentage),
        score: Math.round(averageScore),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting user course:", insertError)
      }
    }
  } catch (error) {
    console.error("Error updating course progress:", error)
  }
}
