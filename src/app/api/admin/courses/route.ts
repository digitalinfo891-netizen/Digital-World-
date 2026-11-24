import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { CourseAccessType, CourseStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function adminUser() {
  const user = await getCurrentUser();
  return user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) ? user : null;
}

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) &&
    value > 0 && value <= 10000000 && Math.round(value * 100) === value * 100;
}

export async function GET() {
  try {
    const admin = await adminUser();
    if (!admin) return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });

    const courses = await prisma.course.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, slug: true, description: true, thumbnail: true,
        status: true, sortOrder: true, createdAt: true, updatedAt: true,
        _count: { select: { modules: true } },
      },
    });

    return NextResponse.json({
      success: true,
      courses: courses.map((course) => ({
        ...course,
        accessType: "MEMBERSHIP",
        _count: { modules: 0, enrollments: 0, payments: 0 },
        price: null,
        certificateEnabled: false,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin courses GET error:", error);
    return NextResponse.json({ success: false, error: "Unable to load courses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await adminUser();
    if (!admin) return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid course data." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 200) {
      return NextResponse.json({ success: false, error: "Enter a course title (maximum 200 characters)." }, { status: 400 });
    }
    if (typeof input.description !== "string" || !input.description.trim()) {
      return NextResponse.json({ success: false, error: "Course description is required." }, { status: 400 });
    }

    const title = (input.title as string).trim();
    const description = (input.description as string).trim();

    const accessType = input.accessType === undefined ? CourseAccessType.MEMBERSHIP : input.accessType;
    if (typeof accessType !== "string" || !Object.values(CourseAccessType).includes(accessType as CourseAccessType)) {
      return NextResponse.json({ success: false, error: "Invalid access type." }, { status: 400 });
    }

    let price: number | null = null;
    if (accessType === CourseAccessType.PAID) {
      if (!validPrice(input.price)) return NextResponse.json({ success: false, error: "Enter a valid INR price with up to two decimals." }, { status: 400 });
      price = input.price;
    } else if (input.price !== undefined && input.price !== null && input.price !== "") {
      return NextResponse.json({ success: false, error: "Only paid courses can have a price." }, { status: 400 });
    }

    const slugInput = typeof input.slug === "string" && input.slug.trim() ? input.slug : input.title;
    const slug = slugify(slugInput);
    if (!slug || slug.length > 180) return NextResponse.json({ success: false, error: "Enter a valid course slug." }, { status: 400 });

    const duplicate = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
    if (duplicate) return NextResponse.json({ success: false, error: "A course with this slug already exists." }, { status: 409 });

    let thumbnail: string | null = null;
    if (input.thumbnail !== undefined && input.thumbnail !== null && input.thumbnail !== "") {
      if (typeof input.thumbnail !== "string" || input.thumbnail.trim().length > 2048 || !/^https?:\/\//i.test(input.thumbnail.trim())) {
        return NextResponse.json({ success: false, error: "Thumbnail must be an HTTP(S) URL." }, { status: 400 });
      }
      thumbnail = input.thumbnail.trim();
    }

    const certificateEnabled = input.certificateEnabled === undefined ? false : input.certificateEnabled;
    if (typeof certificateEnabled !== "boolean") return NextResponse.json({ success: false, error: "Invalid certificate setting." }, { status: 400 });

    const sortOrder = input.sortOrder === undefined ? 0 : input.sortOrder;
    if (typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0) {
      return NextResponse.json({ success: false, error: "Invalid sort order." }, { status: 400 });
    }

    const status = input.status === undefined ? CourseStatus.DRAFT : input.status;
    if (typeof status !== "string" || !Object.values(CourseStatus).includes(status as CourseStatus)) {
      return NextResponse.json({ success: false, error: "Invalid course status." }, { status: 400 });
    }

    const course = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const created = { id: randomUUID(), title, slug, description, thumbnail, status: status as CourseStatus, sortOrder, createdAt: now, updatedAt: now };
      await tx.$executeRaw`
        INSERT INTO "Course" ("id", "title", "slug", "description", "thumbnail", "status", "sortOrder", "createdAt", "updatedAt")
        VALUES (${created.id}, ${title}, ${slug}, ${description}, ${thumbnail}, ${status}::"CourseStatus", ${sortOrder}, ${now}, ${now})
      `;
      await tx.auditLog.create({ data: { actorId: admin.id, action: "COURSE_CREATED", entityType: "Course", entityId: created.id, metadata: { title: created.title, slug: created.slug, status: created.status } } });
      return created;
    });
    return NextResponse.json({
      success: true,
      course: { ...course, accessType: "MEMBERSHIP", price: null, certificateEnabled: false, _count: { modules: 0, enrollments: 0, payments: 0 }, createdAt: course.createdAt.toISOString(), updatedAt: course.updatedAt.toISOString() },
    }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "A course with this slug already exists." }, { status: 409 });
    }
    console.error("Admin courses POST error:", error);
    return NextResponse.json({ success: false, error: "Unable to create course." }, { status: 500 });
  }
}
