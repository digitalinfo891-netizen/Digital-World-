import { NextResponse } from "next/server";
import { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLearningAccess } from "@/lib/course-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { user, allowed } = await getLearningAccess();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please log in to continue." },
        { status: 401 }
      );
    }

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "An active course entitlement is required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (typeof body.completed !== "boolean") {
      return NextResponse.json(
        { success: false, error: "A valid completed value is required." },
        { status: 400 }
      );
    }

    const { lessonId } = await params;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        isPublished: true,
      },
      select: {
        id: true,
        module: {
          select: {
            course: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!lesson || lesson.module.course.status !== CourseStatus.PUBLISHED) {
      return NextResponse.json(
        { success: false, error: "Lesson not found." },
        { status: 404 }
      );
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
      create: {
        userId: user.id,
        lessonId: lesson.id,
        completedAt: body.completed ? new Date() : null,
      },
      update: {
        completedAt: body.completed ? new Date() : null,
      },
      select: {
        lessonId: true,
        completedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: body.completed
        ? "Lesson marked as completed."
        : "Lesson completion removed.",
      progress,
    });
  } catch (error) {
    console.error("Lesson progress API failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update lesson progress." },
      { status: 500 }
    );
  }
}