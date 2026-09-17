import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File exceeds 10MB size limit." },
        { status: 400 }
      );
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Unsupported file type. Allowed: Images, PDF, Word documents." },
        { status: 400 }
      );
    }

    // 3. Generate unique fileKey to avoid collision and URL guessing
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(file.name);
    const uniqueKey = `${crypto.randomUUID()}${fileExt}`;

    // 4. Save to uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, uniqueKey);
    await writeFile(filePath, fileBuffer);

    // Return metadata ready to attach to Message API
    return NextResponse.json(
      {
        success: true,
        data: {
          fileName: file.name,
          fileKey: uniqueKey,
          fileUrl: `/uploads/${uniqueKey}`,
          mimeType: file.type,
          fileSize: file.size,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ success: false, message: "File upload failed" }, { status: 500 });
  }
}