
import { NextResponse } from "next/server";
import { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await prisma.course.findFirst({
      where: {
        slug,
        status: CourseStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        accessType: true,
        price: true,
        certificateEnabled: true,
        modules: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            sortOrder: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                durationSec: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        price: course.price?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("Course details API failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load course details." },
      { status: 500 }
    );
  }
}
