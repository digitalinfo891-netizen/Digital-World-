
import { NextResponse } from "next/server";
import { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
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

    return NextResponse.json({
      success: true,
      count: courses.length,
      courses: courses.map((course) => ({
        ...course,
        price: course.price?.toString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Course catalogue API failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load courses." },
      { status: 500 }
    );
  }
}
