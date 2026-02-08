#!/bin/bash

# OpenOrder API Manual Test Script
# Copyright (C) 2026  Josh Gunning
# AGPL-3.0 License
#
# This script tests all CRUD endpoints manually using curl
# Prerequisites: API server running on http://localhost:4000

set -e  # Exit on error

API_URL="${API_URL:-http://localhost:4000}"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo "======================================"
echo "OpenOrder API Manual Test Script"
echo "API URL: $API_URL"
echo "======================================"
echo ""

# Helper functions
print_test() {
    echo -e "${COLOR_BLUE}TEST:${COLOR_RESET} $1"
}

print_success() {
    echo -e "${COLOR_GREEN}✓ PASS${COLOR_RESET}"
    echo ""
}

print_error() {
    echo -e "${COLOR_RED}✗ FAIL:${COLOR_RESET} $1"
    exit 1
}

# Test variables
TIMESTAMP=$(date +%s)
RESTAURANT_SLUG="test-restaurant-${TIMESTAMP}"
USER_EMAIL="test-${TIMESTAMP}@example.com"
USER_PASSWORD="SecurePassword123!"
TOKEN=""
RESTAURANT_ID=""
CATEGORY_ID=""
ITEM_ID=""
IMAGE_ID=""

# ==========================================
# 1. Health Check
# ==========================================
print_test "Health check"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Health check failed (HTTP $HTTP_CODE)"
fi

if echo "$BODY" | grep -q "healthy"; then
    print_success
else
    print_error "Health check response invalid: $BODY"
fi

# ==========================================
# 2. Generate Restaurant Slug
# ==========================================
print_test "Generate restaurant slug"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/restaurants/generate-slug" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Test Restaurant ${TIMESTAMP}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Generate slug failed (HTTP $HTTP_CODE)"
fi

GENERATED_SLUG=$(echo "$BODY" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
if [ -n "$GENERATED_SLUG" ]; then
    echo "Generated slug: $GENERATED_SLUG"
    print_success
else
    print_error "No slug generated"
fi

# ==========================================
# 3. Register User & Create Restaurant
# ==========================================
print_test "Register new user and create restaurant"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${USER_EMAIL}\",
        \"password\": \"${USER_PASSWORD}\",
        \"firstName\": \"Test\",
        \"lastName\": \"User\",
        \"restaurantName\": \"Test Restaurant ${TIMESTAMP}\",
        \"restaurantSlug\": \"${RESTAURANT_SLUG}\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "201" ]; then
    print_error "Registration failed (HTTP $HTTP_CODE): $BODY"
fi

# Extract tokens
ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
RESTAURANT_ID=$(echo "$BODY" | grep -o '"restaurantId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    print_error "No access token received"
fi

TOKEN="$ACCESS_TOKEN"
echo "Access token: ${TOKEN:0:50}..."
echo "Restaurant ID: $RESTAURANT_ID"
print_success

# ==========================================
# 4. Login
# ==========================================
print_test "Login with credentials"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${USER_EMAIL}\",
        \"password\": \"${USER_PASSWORD}\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Login failed (HTTP $HTTP_CODE)"
fi

print_success

# ==========================================
# 5. Get Restaurant by Slug
# ==========================================
print_test "Get restaurant by slug (public endpoint)"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${API_URL}/restaurants/${RESTAURANT_SLUG}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Get restaurant failed (HTTP $HTTP_CODE)"
fi

if echo "$BODY" | grep -q "$RESTAURANT_SLUG"; then
    print_success
else
    print_error "Restaurant slug not found in response"
fi

# ==========================================
# 6. Create Menu Category
# ==========================================
print_test "Create menu category"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/categories" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Appetizers",
        "description": "Start your meal right",
        "isActive": true
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "201" ]; then
    print_error "Create category failed (HTTP $HTTP_CODE): $BODY"
fi

CATEGORY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
echo "Category ID: $CATEGORY_ID"
print_success

# ==========================================
# 7. List Menu Categories
# ==========================================
print_test "List menu categories"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/categories" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "List categories failed (HTTP $HTTP_CODE)"
fi

if echo "$BODY" | grep -q "Appetizers"; then
    print_success
else
    print_error "Category not found in list"
fi

# ==========================================
# 8. Create Menu Item
# ==========================================
print_test "Create menu item"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/items" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Buffalo Wings\",
        \"description\": \"Spicy chicken wings with blue cheese\",
        \"price\": 1295,
        \"categoryId\": \"${CATEGORY_ID}\",
        \"isActive\": true,
        \"isAvailable\": true
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "201" ]; then
    print_error "Create item failed (HTTP $HTTP_CODE): $BODY"
fi

ITEM_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
echo "Item ID: $ITEM_ID"
print_success

# ==========================================
# 9. Get Menu Item
# ==========================================
print_test "Get menu item by ID"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/items/${ITEM_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Get item failed (HTTP $HTTP_CODE)"
fi

if echo "$BODY" | grep -q "Buffalo Wings"; then
    print_success
else
    print_error "Item not found"
fi

# ==========================================
# 10. Update Menu Item
# ==========================================
print_test "Update menu item"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/items/${ITEM_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "price": 1395
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Update item failed (HTTP $HTTP_CODE)"
fi

if echo "$BODY" | grep -q "1395"; then
    print_success
else
    print_error "Price not updated"
fi

# ==========================================
# 11. Toggle Item Availability
# ==========================================
print_test "Toggle item availability (86 item)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/items/${ITEM_ID}/availability" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "isAvailable": false
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Toggle availability failed (HTTP $HTTP_CODE)"
fi

print_success

# ==========================================
# 12. Upload Image
# ==========================================
print_test "Upload image"

# Create a test 1x1 PNG image
TEST_IMAGE="/tmp/test-image-${TIMESTAMP}.png"
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$TEST_IMAGE"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/media/upload" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@${TEST_IMAGE};type=image/png")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "201" ]; then
    print_error "Upload image failed (HTTP $HTTP_CODE): $BODY"
fi

IMAGE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
IMAGE_URL=$(echo "$BODY" | grep -o '"url":"[^"]*"' | head -n1 | cut -d'"' -f4)
echo "Image ID: $IMAGE_ID"
echo "Image URL: $IMAGE_URL"
print_success

# ==========================================
# 13. Get Image (Public)
# ==========================================
print_test "Retrieve uploaded image (public endpoint)"
RESPONSE=$(curl -s -w "\n%{http_code}" -o /dev/null \
    "${API_URL}/media/${IMAGE_ID}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" != "200" ]; then
    print_error "Get image failed (HTTP $HTTP_CODE)"
fi

print_success

# ==========================================
# 14. Test Unauthorized Access
# ==========================================
print_test "Test unauthorized access (should fail)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/categories" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Unauthorized Category"
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
    print_success
else
    print_error "Should have rejected unauthorized request (got HTTP $HTTP_CODE)"
fi

# ==========================================
# 15. Delete Menu Item (Soft Delete)
# ==========================================
print_test "Delete menu item (soft delete)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
    "${API_URL}/restaurants/${RESTAURANT_ID}/menu/items/${ITEM_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" != "204" ]; then
    print_error "Delete item failed (HTTP $HTTP_CODE)"
fi

print_success

# ==========================================
# 16. Delete Image
# ==========================================
print_test "Delete uploaded image"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
    "${API_URL}/media/${IMAGE_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" != "204" ]; then
    print_error "Delete image failed (HTTP $HTTP_CODE)"
fi

print_success

# Cleanup
rm -f "$TEST_IMAGE"

# ==========================================
# Summary
# ==========================================
echo "======================================"
echo -e "${COLOR_GREEN}All tests passed!${COLOR_RESET}"
echo "======================================"
echo ""
echo "Test Data Created:"
echo "  Restaurant: $RESTAURANT_SLUG"
echo "  Email: $USER_EMAIL"
echo "  Password: $USER_PASSWORD"
echo ""
echo "You can clean up test data manually in Prisma Studio"
echo "or by running: pnpm db:studio"
echo ""
