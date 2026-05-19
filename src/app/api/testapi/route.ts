import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

function toSafeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const id = toSafeString(body.id) || crypto.randomUUID();
  const name = toSafeString(body.name);
  const description = toSafeString(body.description);

  if (!name || !description) {
    return Response.json(
      { success: false, message: "`name` and `description` are required." },
      { status: 400 },
    );
  }

  const recordId = await fetchMutation(api.testapi.saveTestRecord, {
    id,
    name,
    description,
    source: "public-api",
  });

  return Response.json(
    {
      success: true,
      message: "Record stored in Convex.",
      data: { recordId, id, name, description },
    },
    { status: 201 },
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitParam) ? limitParam : 20;

  const records = await fetchQuery(api.testapi.listTestRecords, { limit });

  return Response.json({
    success: true,
    count: records.length,
    records,
  });
}
