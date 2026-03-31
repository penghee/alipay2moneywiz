import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getYearDataDirectory } from "@/config/paths";
import ownersData from "@/config/bill_owners.json";

// Helper function to get owner name
function getOwnerName(ownerId: string): string {
  try {
    const owners = ownersData.owners as Array<{ id: string; name: string }>;
    const owner = owners.find((o) => o.id === ownerId);
    return owner ? owner.name : ownerId; // Return ID if not found
  } catch (error) {
    console.error("Error loading owner mapping:", error);
    return ownerId; // Fallback to ID if there's an error
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> },
) {
  try {
    const { year, month } = await params;
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "Invalid year or month parameter" },
        { status: 400 },
      );
    }

    // Get the year data directory
    const yearDir = getYearDataDirectory(yearNum);

    // Construct the file path
    const fileName = `${String(monthNum).padStart(2, "0")}.csv`;
    const filePath = path.join(yearDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Data file not found" },
        { status: 404 },
      );
    }

    // If owner is specified, we need to check if this file contains transactions from that owner
    if (owner && owner !== "all") {
      try {
        // Read the file to check if it contains transactions from the specified owner
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");

        // Skip header and check if any transaction belongs to the owner
        const ownerName = getOwnerName(owner);
        const hasOwnerTransactions = lines.slice(1).some((line) => {
          if (!line.trim()) return false;
          const columns = line.split(",");
          const ownerField = columns[9]; // 账单人 field
          return ownerField === ownerName;
        });

        if (!hasOwnerTransactions) {
          return NextResponse.json(
            { error: "No transactions found for specified owner" },
            { status: 404 },
          );
        }
      } catch (error) {
        console.error("Error checking owner transactions:", error);
        // Continue with deletion even if owner check fails
      }
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully deleted data for ${year}-${String(monthNum).padStart(2, "0")}${owner ? ` (owner: ${owner})` : ""}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting month data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 },
    );
  }
}
