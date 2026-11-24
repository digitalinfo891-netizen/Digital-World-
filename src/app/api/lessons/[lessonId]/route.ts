import { NextResponse } from "next/server";
import { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLearningAccess } from "@/lib/course-access";

export async function GET(
  _request: Request,
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

    const { lessonId } = await params;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        type: true,
        contentUrl: true,
        textContent: true,
        durationSec: true,
        module: {
          select: {
            title: true,
            course: {
              select: {
                title: true,
                slug: true,
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

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
      select: {
        completedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      lesson,
      progress,
    });
  } catch (error) {
    console.error("Lesson content API failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load lesson content." },
      { status: 500 }
    );
  }
}