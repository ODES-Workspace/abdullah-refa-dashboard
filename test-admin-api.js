// Simple test script to check admin API endpoints
// This script will help verify if the admin endpoints for categories and types work

const baseUrl = "https://dev.refa.sa/api";

// You'll need to replace this with an actual admin auth token
const adminToken = "your-admin-token-here";

async function testAdminEndpoints() {
  console.log("Testing admin API endpoints...");

  try {
    // Test categories endpoint
    console.log("\n1. Testing categories endpoint:");
    const categoriesResponse = await fetch(`${baseUrl}/admin/categories`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Categories status:", categoriesResponse.status);
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log("Categories data:", categoriesData);
    } else {
      console.log("Categories error:", await categoriesResponse.text());
    }

    // Test property types endpoint
    console.log("\n2. Testing property types endpoint:");
    const typesResponse = await fetch(`${baseUrl}/admin/property-types`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Types status:", typesResponse.status);
    if (typesResponse.ok) {
      const typesData = await typesResponse.json();
      console.log("Types data:", typesData);
    } else {
      console.log("Types error:", await typesResponse.text());
    }
  } catch (error) {
    console.error("Error testing endpoints:", error);
  }
}

// Uncomment the line below and add a valid admin token to run this test
// testAdminEndpoints();

console.log(
  "Test script created. Replace the admin token and uncomment the last line to run."
);
