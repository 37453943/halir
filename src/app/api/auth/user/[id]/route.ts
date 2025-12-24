// app/api/auth/users/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/Users";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const { id } = params;
    const body = await req.json();

    const updatedUser = await User.findByIdAndUpdate(id, body, { new: true }).select("-password");
    if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(updatedUser, { status: 200 });
}
