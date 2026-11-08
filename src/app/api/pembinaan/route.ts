import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json(
        { error: "Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    if (
      session.effectiveUser.role !== "PEMBINA_SEKTORAL" &&
      session.effectiveUser.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Hanya Pembina Sektoral BPS atau Superadmin yang dapat menambahkan jadwal pembinaan.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      topic,
      description,
      date,
      startTime,
      endTime,
      location,
      mode = "TATAP_MUKA",
      status = "TERJADWAL",
      opdId,
      pembinaName,
      notes,
    } = body;

    if (!title || !topic || !date || !location) {
      return NextResponse.json(
        { error: "Nama kegiatan, topik domain, tanggal, dan lokasi wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.coachingSchedule.create({
      data: {
        title: String(title).trim(),
        topic: String(topic).trim(),
        description: description ? String(description).trim() : null,
        date: new Date(date),
        startTime: String(startTime || "09.00"),
        endTime: String(endTime || "12.00 WITA"),
        location: String(location).trim(),
        mode: String(mode),
        status: String(status),
        opdId: opdId && opdId !== "ALL" ? String(opdId) : null,
        pembinaName: String(pembinaName || session.effectiveUser.name),
        notes: notes ? String(notes).trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      schedule: created,
    });
  } catch (error) {
    console.error("Create coaching schedule error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan jadwal pembinaan baru." },
      { status: 500 }
    );
  }
}

