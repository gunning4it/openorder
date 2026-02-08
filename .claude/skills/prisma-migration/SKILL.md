---
name: prisma-migration
description: Create and validate Prisma database migrations. Use after schema.prisma changes or when adding new database features.
disable-model-invocation: false
allowed-tools: Bash(cd apps/api*), Bash(npx prisma*), Read, Edit
---

# Prisma Migration Helper

This skill streamlines the database migration workflow with proper naming conventions and validation.

## Workflow

1. **Detect Schema Changes**
   - Check if `apps/api/prisma/schema.prisma` has uncommitted changes
   - Verify changes are intentional

2. **Generate Migration Name**
   - Follow convention: `add_table_name`, `update_field_type`, `remove_column_name`
   - Examples:
     - `add_order_notes` - Adding new table
     - `update_price_to_bigint` - Changing field type
     - `add_restaurant_timezone` - Adding new field
   - Ask user for descriptive name if changes are complex

3. **Create Migration**
   ```bash
   cd apps/api && npx prisma migrate dev --name <migration-name>
   ```

4. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Verify Migration**
   - Check migration file was created in `apps/api/prisma/migrations/`
   - Show the generated SQL for review
   - Verify no syntax errors

6. **Post-Migration Checks**
   - Remind to test migration on fresh database before committing
   - Check if any packages depend on shared-types and suggest rebuilding:
     ```bash
     cd apps/storefront && npm run build
     cd apps/dashboard && npm run build
     ```

7. **Important Reminders**
   - Never edit migration files manually after creation
   - Test migrations on fresh database: `docker compose down -v && docker compose up -d`
   - Always run `npx prisma generate` after schema changes
   - Consider impact on existing data (add default values for NOT NULL columns)

## Error Handling

If migration fails:
- Check for breaking changes (removing required fields without defaults)
- Verify database is accessible
- Check for conflicting migrations
- Suggest using `npx prisma migrate reset` for development (WARNING: deletes all data)

## OpenOrder-Specific Patterns

- **Prices in cents:** Always use `Int` for monetary values, never `Float`
- **Timestamps:** Use `@default(now())` for `createdAt`, `@updatedAt` for `updatedAt`
- **Encrypted fields:** Use `Json` type for `posConfig`, `paymentConfig`
- **Sequences:** Use `@default(autoincrement())` for `orderNumber` per restaurant
