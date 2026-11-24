import { NextResponse } from "next/server";
import { CourseStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };
type CourseRow = { id: string; title: string; slug: string; description: string; thumbnail: string | null; status: CourseStatus; sortOrder: number; createdAt: Date; updatedAt: Date };

async function adminUser() {
  const user = await getCurrentUser();
  return user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) ? user : null;
}

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) &&
    value > 0 && value <= 10000000 && Math.round(value * 100) === value * 100;
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const admin = await adminUser();
    if (!admin) return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, error: "Invalid course data." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const oldRows = await prisma.$queryRaw<CourseRow[]>`SELECT "id", "title", "slug", "description", "thumbnail", "status", "sortOrder", "createdAt", "updatedAt" FROM "Course" WHERE "id" = ${id} LIMIT 1`;
    const old = oldRows[0];
    if (!old) return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });

    const data: { title?: string; description?: string; slug?: string; thumbnail?: string | null; sortOrder?: number; status?: CourseStatus } = {};
    if (input.title !== undefined) {
      if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 200) return NextResponse.json({ success: false, error: "Invalid title." }, { status: 400 });
      data.title = input.title.trim();
    }
    if (input.description !== undefined) {
      if (typeof input.description !== "string" || !input.description.trim()) return NextResponse.json({ success: false, error: "Description is required." }, { status: 400 });
      data.description = input.description.trim();
    }
    if (input.slug !== undefined) {
      if (typeof input.slug !== "string" || !input.slug.trim()) return NextResponse.json({ success: false, error: "Invalid slug." }, { status: 400 });
      const slug = slugify(input.slug);
      if (!slug || slug.length > 180) return NextResponse.json({ success: false, error: "Invalid slug." }, { status: 400 });
      const duplicateRows = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Course" WHERE "slug" = ${slug} AND "id" <> ${id} LIMIT 1`;
      if (duplicateRows.length) return NextResponse.json({ success: false, error: "Slug already exists." }, { status: 409 });
      data.slug = slug;
    }
    if (input.thumbnail !== undefined) {
      if (input.thumbnail === null || input.thumbnail === "") data.thumbnail = null;
      else if (typeof input.thumbnail !== "string" || input.thumbnail.trim().length > 2048 || !/^https?:\/\//i.test(input.thumbnail.trim())) return NextResponse.json({ success: false, error: "Thumbnail must be an HTTP(S) URL." }, { status: 400 });
      else data.thumbnail = input.thumbnail.trim();
    }
    if (input.sortOrder !== undefined) {
      if (typeof input.sortOrder !== "number" || !Number.isInteger(input.sortOrder) || input.sortOrder < 0) return NextResponse.json({ success: false, error: "Invalid sort order." }, { status: 400 });
      data.sortOrder = input.sortOrder;
    }
    if (input.status !== undefined) {
      if (typeof input.status !== "string" || !Object.values(CourseStatus).includes(input.status as CourseStatus)) return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
      data.status = input.status as CourseStatus;
    }
    if (!Object.keys(data).length) return NextResponse.json({ success: false, error: "No changes supplied." }, { status: 400 });

    const course = await prisma.$transaction(async tx => {
      const updated: CourseRow = { ...old, ...data, updatedAt: new Date() };
      await tx.$executeRaw`UPDATE "Course" SET "title" = ${updated.title}, "slug" = ${updated.slug}, "description" = ${updated.description}, "thumbnail" = ${updated.thumbnail}, "status" = ${updated.status}::"CourseStatus", "sortOrder" = ${updated.sortOrder}, "updatedAt" = ${updated.updatedAt} WHERE "id" = ${id}`;
      await tx.auditLog.create({ data: { actorId: admin.id, action: "COURSE_UPDATED", entityType: "Course", entityId: id, metadata: { changedFields: Object.keys(data), status: updated.status } } });
      return updated;
    });
    return NextResponse.json({ success: true, course: { ...course, accessType: "MEMBERSHIP", price: null, certificateEnabled: false, _count: { modules: 0, enrollments: 0, payments: 0 }, createdAt: course.createdAt.toISOString(), updatedAt: course.updatedAt.toISOString() } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ success: false, error: "Slug already exists." }, { status: 409 });
    console.error("Admin course PATCH error:", error);
    return NextResponse.json({ success: false, error: "Unable to update course." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const admin = await adminUser();
    if (!admin) return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    await params;
    return NextResponse.json({ success: false, error: "Course archiving is temporarily disabled until the Phase 2 enrollment migration is applied and learner access can be verified." }, { status: 409 });
  } catch (error) {
    console.error("Admin course DELETE error:", error);
    return NextResponse.json({ success: false, error: "Unable to process archive request." }, { status: 500 });
  }
}