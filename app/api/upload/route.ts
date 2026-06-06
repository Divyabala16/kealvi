import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get("file") as File;

  if (!file) {
    return Response.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("question-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("question-images")
    .getPublicUrl(fileName);

  return Response.json({
    image_url: publicUrl,
  });
}