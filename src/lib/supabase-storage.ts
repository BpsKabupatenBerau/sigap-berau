const DEFAULT_BUCKET = "sigap-documents";

function getSupabaseConfig() {
  const rawUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const url = rawUrl.trim().replace(/\/+$/, "");
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim();
  const bucket = (
    process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET
  ).trim();

  return { url, serviceKey, bucket };
}

export function isSupabaseStorageConfigured(): boolean {
  const { url, serviceKey } = getSupabaseConfig();
  return Boolean(url && serviceKey);
}

let bucketChecked = false;

async function ensureBucketExists(
  url: string,
  serviceKey: string,
  bucket: string
): Promise<void> {
  if (bucketChecked) return;

  try {
    const checkRes = await fetch(
      `${url}/storage/v1/bucket/${encodeURIComponent(bucket)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      }
    );

    if (checkRes.ok) {
      bucketChecked = true;
      return;
    }

    // Create public bucket automatically if it does not exist yet
    const createRes = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: bucket,
        name: bucket,
        public: true,
        file_size_limit: 5242880, // 5MB
      }),
    });

    if (createRes.ok || createRes.status === 409) {
      bucketChecked = true;
    }
  } catch (err) {
    console.warn("Gagal memeriksa/membuat bucket Supabase Storage:", err);
  }
}

export async function uploadBufferToSupabase({
  folder,
  fileName,
  buffer,
  contentType,
}: {
  folder: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ publicUrl: string; objectPath: string }> {
  const { url, serviceKey, bucket } = getSupabaseConfig();

  if (!url || !serviceKey) {
    throw new Error(
      "Konfigurasi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diatur."
    );
  }

  await ensureBucketExists(url, serviceKey, bucket);

  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const objectPath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const uploadUrl = `${url}/storage/v1/object/${encodeURIComponent(
    bucket
  )}/${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(
      `Gagal mengunggah berkas ke Supabase Storage (${response.status}): ${errText}`
    );
  }

  const publicUrl = `${url}/storage/v1/object/public/${encodeURIComponent(
    bucket
  )}/${encodedPath}`;

  return { publicUrl, objectPath };
}

export async function deleteFromSupabaseByUrl(fileUrl: string): Promise<void> {
  const { url, serviceKey, bucket } = getSupabaseConfig();
  if (!url || !serviceKey || !fileUrl) return;

  const publicPrefix = `${url}/storage/v1/object/public/${encodeURIComponent(
    bucket
  )}/`;

  if (!fileUrl.startsWith(publicPrefix)) {
    return;
  }

  const encodedObjectPath = fileUrl.slice(publicPrefix.length);
  if (!encodedObjectPath) return;

  try {
    await fetch(
      `${url}/storage/v1/object/${encodeURIComponent(
        bucket
      )}/${encodedObjectPath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      }
    );
  } catch (err) {
    console.warn("Gagal menghapus berkas lama di Supabase Storage:", err);
  }
}

