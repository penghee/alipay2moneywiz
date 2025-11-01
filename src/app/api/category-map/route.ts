import { NextResponse } from "next/server";
import fs from "fs/promises";
import { DATA_PATHS } from "@/config/paths";
export const dynamic = "force-dynamic"; // Prevent static generation

type CategoryMap = Record<string, string[]>;

type CategoryAction =
  | { action: "addCategory"; name: string }
  | { action: "deleteCategory"; name: string }
  | { action: "addTag"; category: string; tag: string }
  | { action: "deleteTag"; category: string; tag: string };

// Helper function to read the category map file
async function readCategoryMap(): Promise<CategoryMap> {
  try {
    const fileContent = await fs.readFile(DATA_PATHS.maps.category(), "utf-8");
    return JSON.parse(fileContent) as CategoryMap;
  } catch (error) {
    // If file doesn't exist or is invalid, return empty object
    return {};
  }
}

export async function GET() {
  try {
    const categoryMap = await readCategoryMap();
    return NextResponse.json(categoryMap);
  } catch (error) {
    console.error("Error reading category map:", error);
    return NextResponse.json(
      { error: "Failed to load category map" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json();

    // Validate the updates object
    if (typeof updates !== "object" || updates === null) {
      return NextResponse.json(
        { error: "Invalid update format" },
        { status: 400 },
      );
    }

    // Read current category map
    const categoryMap = await readCategoryMap();

    // Apply updates to the category map
    for (const [action, data] of Object.entries(
      updates as Record<string, CategoryAction>,
    )) {
      const typedData = data as CategoryAction;

      switch (action) {
        case "addCategory":
          if ("name" in typedData && !categoryMap[typedData.name]) {
            categoryMap[typedData.name] = [];
          }
          break;

        case "deleteCategory":
          if ("name" in typedData && categoryMap[typedData.name]) {
            delete categoryMap[typedData.name];
          }
          break;

        case "addTag":
          if (
            "category" in typedData &&
            "tag" in typedData &&
            Array.isArray(categoryMap[typedData.category])
          ) {
            if (!categoryMap[typedData.category].includes(typedData.tag)) {
              categoryMap[typedData.category].push(typedData.tag);
            }
          }
          break;

        case "deleteTag":
          if (
            "category" in typedData &&
            "tag" in typedData &&
            Array.isArray(categoryMap[typedData.category])
          ) {
            categoryMap[typedData.category] = categoryMap[
              typedData.category
            ].filter((tag) => tag !== typedData.tag);
          }
          break;
      }
    }

    // Write the updated category map back to the file
    await fs.writeFile(
      DATA_PATHS.maps.category(),
      JSON.stringify(categoryMap, null, 2),
      "utf-8",
    );

    return NextResponse.json({ success: true, data: categoryMap });
  } catch (error) {
    console.error("Error updating category map:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update category map", details: errorMessage },
      { status: 500 },
    );
  }
}
