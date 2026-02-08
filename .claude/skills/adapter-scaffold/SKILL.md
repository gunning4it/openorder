---
name: adapter-scaffold
description: Scaffold new POS or payment adapter implementations. Use when adding support for Square, Toast, Clover, Stripe, or other integrations.
disable-model-invocation: false
allowed-tools: Read, Write, Bash(cd packages/*)
---

# Adapter Scaffold Generator

This skill generates new POS or payment adapter implementations following the adapter pattern.

## Workflow

1. **Gather Requirements**

   Ask user:
   - **Adapter Type:** POS or Payment?
   - **Vendor Name:** Square, Toast, Clover, Stripe, PayPal, etc.

   Example:
   ```
   Creating new adapter. Please provide:
   1. Adapter type (POS or Payment):
   2. Vendor name (e.g., Square, Toast, Stripe):
   ```

2. **Read Adapter Interface**

   **For POS Adapters:**
   ```bash
   # Read interface definition
   cat packages/pos-adapters/src/types.ts
   ```

   Interface includes:
   - `testConnection(config)` - Verify credentials and API access
   - `pullMenu(config)` - Fetch menu from POS system
   - `pushOrder(config, order)` - Send order to POS
   - `parseWebhook(body, headers)` - Parse webhook events
   - `parseStockUpdate(webhookData)` - Parse inventory updates

   **For Payment Adapters:**
   ```bash
   # Read interface definition
   cat packages/payment-adapters/src/types.ts
   ```

   Interface includes:
   - `createPayment(config, amount, metadata)` - Create payment intent
   - `parseWebhook(body, headers)` - Parse webhook events
   - `refund(config, paymentId, amount)` - Process refunds

3. **Read Example Implementation**

   **For POS:**
   ```bash
   # Use Square as reference
   cat packages/pos-adapters/src/square.ts
   ```

   **For Payment:**
   ```bash
   # Use Stripe as reference
   cat packages/payment-adapters/src/stripe.ts
   ```

4. **Generate Adapter File**

   Create new file at:
   - POS: `packages/pos-adapters/src/{vendor}.ts`
   - Payment: `packages/payment-adapters/src/{vendor}.ts`

   **Template Structure:**

   ```typescript
   // AGPL-3.0 License Header
   // This file is part of OpenOrder.
   //
   // OpenOrder is free software: you can redistribute it and/or modify
   // it under the terms of the GNU Affero General Public License as published by
   // the Free Software Foundation, either version 3 of the License, or
   // (at your option) any later version.
   //
   // OpenOrder is distributed in the hope that it will be useful,
   // but WITHOUT ANY WARRANTY; without even the implied warranty of
   // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   // GNU Affero General Public License for more details.
   //
   // You should have received a copy of the GNU Affero General Public License
   // along with OpenOrder. If not, see <https://www.gnu.org/licenses/>.

   import { IPosAdapter, PosConfig, PosMenu, PosOrder, PosWebhookEvent } from './types';

   export class {Vendor}Adapter implements IPosAdapter {
     async testConnection(config: PosConfig): Promise<boolean> {
       // TODO: Implement {Vendor} API connection test
       // 1. Validate config contains required fields (apiKey, locationId, etc.)
       // 2. Make test API call to verify credentials
       // 3. Return true if successful, throw error if not
       throw new Error('Not implemented');
     }

     async pullMenu(config: PosConfig): Promise<PosMenu> {
       // TODO: Implement menu sync from {Vendor}
       // 1. Authenticate with {Vendor} API
       // 2. Fetch categories, items, modifiers
       // 3. Transform to normalized PosMenu format
       // 4. Handle pagination if needed
       throw new Error('Not implemented');
     }

     async pushOrder(config: PosConfig, order: PosOrder): Promise<string> {
       // TODO: Implement order creation in {Vendor}
       // 1. Transform PosOrder to {Vendor} format
       // 2. Handle modifiers and special instructions
       // 3. Create order via API
       // 4. Return {Vendor} order ID
       throw new Error('Not implemented');
     }

     parseWebhook(body: any, headers: Record<string, string>): PosWebhookEvent | null {
       // TODO: Implement {Vendor} webhook parsing
       // 1. Verify webhook signature using headers
       // 2. Parse event type (order.updated, inventory.changed)
       // 3. Transform to normalized PosWebhookEvent
       // 4. Return null if signature invalid or unknown event type
       throw new Error('Not implemented');
     }

     parseStockUpdate(webhookData: any): { itemId: string; available: boolean } | null {
       // TODO: Implement stock update parsing
       // 1. Extract item identifier from webhook
       // 2. Determine availability status
       // 3. Return null if not a stock update event
       throw new Error('Not implemented');
     }
   }
   ```

5. **Update Package Exports**

   Add to `packages/{pos|payment}-adapters/src/index.ts`:

   ```typescript
   export * from './{vendor}';
   ```

6. **Generate Test Stub**

   Create `packages/{pos|payment}-adapters/src/{vendor}.test.ts`:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { {Vendor}Adapter } from './{vendor}';

   describe('{Vendor}Adapter', () => {
     const adapter = new {Vendor}Adapter();

     describe('testConnection', () => {
       it('should validate API credentials', async () => {
         // TODO: Add test with valid credentials
         // TODO: Add test with invalid credentials
       });
     });

     describe('pullMenu', () => {
       it('should fetch and transform menu data', async () => {
         // TODO: Mock API response
         // TODO: Verify transformation to PosMenu format
       });
     });

     describe('pushOrder', () => {
       it('should create order in {Vendor} system', async () => {
         // TODO: Mock API call
         // TODO: Verify order format
       });
     });

     describe('parseWebhook', () => {
       it('should verify webhook signature', () => {
         // TODO: Test valid signature
         // TODO: Test invalid signature (should return null)
       });

       it('should parse order status updates', () => {
         // TODO: Test order.updated event
       });
     });
   });
   ```

7. **Provide Implementation Guidance**

   **Critical Security Requirements:**

   - **Webhook Signature Verification:**
     ```typescript
     // Always verify webhooks before processing
     const signature = headers['x-{vendor}-signature'];
     const expectedSignature = crypto
       .createHmac('sha256', config.webhookSecret)
       .update(JSON.stringify(body))
       .digest('hex');

     if (signature !== expectedSignature) {
       return null; // Invalid signature
     }
     ```

   - **Encrypted Config Storage:**
     ```typescript
     // Sensitive keys stored in encrypted JSONB
     interface {Vendor}Config extends PosConfig {
       apiKey: string;      // Encrypted at rest
       apiSecret: string;   // Encrypted at rest
       locationId: string;  // OK to be plaintext
     }
     ```

   - **Error Handling:**
     ```typescript
     try {
       const response = await fetch('{vendor-api-url}', {
         headers: { Authorization: `Bearer ${config.apiKey}` }
       });

       if (!response.ok) {
         throw new Error(`{Vendor} API error: ${response.status}`);
       }

       return await response.json();
     } catch (error) {
       // Log error but don't expose API keys in error messages
       console.error('[{Vendor}Adapter] API call failed', error);
       throw new Error('Failed to connect to {Vendor}');
     }
     ```

   **Vendor-Specific Considerations:**

   - **Square:** Requires OAuth, supports catalog sync
   - **Toast:** Requires partner approval, limited API access
   - **Clover:** Multiple authentication methods, complex modifier structure
   - **Stripe:** Webhooks require endpoint registration, idempotency keys

   **Data Transformation:**

   Each vendor has different schemas - normalize to OpenOrder format:

   ```typescript
   // Example: Transform {Vendor} menu to PosMenu
   const posMenu: PosMenu = {
     categories: vendorCategories.map(cat => ({
       id: cat.vendorId,
       name: cat.displayName,
       items: cat.products.map(item => ({
         id: item.sku,
         name: item.title,
         description: item.desc,
         price: Math.round(item.priceInDollars * 100), // Dollars to cents
         available: item.inStock
       }))
     }))
   };
   ```

8. **Remind About Next Steps**

   After scaffolding:

   - Read vendor API documentation
   - Set up test account with vendor
   - Implement each method incrementally
   - Add integration tests with real API (use test mode)
   - Update `apps/api/src/services/pos-service.ts` to register new adapter
   - Add vendor to dashboard settings UI
   - Document required config fields in `docs/`

## Common Pitfalls

**1. Forgetting AGPL Header**
Every new file must include the license header.

**2. Incomplete Interface Implementation**
All methods must be implemented, even if just throwing "Not implemented" initially.

**3. Hardcoding Credentials**
Never put API keys in code - always use `config` parameter.

**4. Skipping Webhook Verification**
Unverified webhooks are a security risk - always validate signatures.

**5. Not Handling Pagination**
Many POS APIs paginate menu/order data - implement pagination handling.

**6. Ignoring Rate Limits**
Implement exponential backoff for API calls to respect rate limits.

## Testing Checklist

Before marking adapter complete:

- [ ] All interface methods implemented
- [ ] Webhook signature verification working
- [ ] Error handling for network failures
- [ ] Unit tests for all methods
- [ ] Integration tests with test API credentials
- [ ] Documentation for required config fields
- [ ] AGPL header present
- [ ] Exported from package index
- [ ] Registered in API service layer
