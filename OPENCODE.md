# OPENCODE.md

# NanoPay — OpenCode Development Instructions

## 1. Mission

You are OpenCode, an AI coding agent responsible for developing the NanoPay frontend.

Your objective is to produce a frontend that is:

- premium
- modern
- fast
- responsive
- accessible
- secure
- maintainable
- production-ready

NanoPay is a financial platform connecting:

```text
CLIENT
MERCHANT
BANK
ADMIN

around one central order.

The frontend must simplify the experience without becoming the source of financial truth.

BACKEND = SOURCE OF TRUTH
FRONTEND = EXPERIENCE
2. Mandatory Documentation

Before making significant changes, read:

ARCHITECTURE.md
ARCHITECTURE-ESSENTIALS.md
AGENTS.md
API-CONTRACT.md
DESIGN-SYSTEM.md
SECURITY.md
PRODUCT-FLOWS.md
QA-CHECKLIST.md
README-FRONTEND.md

Use the documentation as the primary reference for:

architecture
business flows
financial rules
security
UI
API behavior
testing
product terminology

Do not invent business rules when the documentation already defines them.

3. First Rule — Inspect Before Coding

Never start by blindly writing code.

First inspect the repository.

Check:

Project structure
package.json
Entry points
Routing
Components
Pages
Hooks
State management
Services
API client
Styles
Assets
Environment files
Tests
Existing documentation

Determine:

What already exists?
What works?
What is incomplete?
What is duplicated?
What is incorrectly architected?
What needs to change?

Only then implement.

4. Standard Operating Procedure

For every task:

INSPECT
   ↓
UNDERSTAND
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
VERIFY
   ↓
POLISH

Do not skip verification.

5. Never Trust the Browser

The browser is untrusted.

Assume the user can manipulate:

HTML
JavaScript
localStorage
sessionStorage
URL
query parameters
frontend state
API requests

Therefore:

Frontend validation = UX
Backend validation = Security

Never implement frontend logic that assumes the browser is authoritative.

6. Backend Is the Source of Truth

The backend owns:

Prices
Balances
Payments
Financing
Credit decisions
Savings calculations
Vault state
Order status
QR validity
Withdrawal authorization
Merchant settlement
Permissions

If frontend state conflicts with backend state:

BACKEND WINS

If localStorage conflicts with backend data:

BACKEND WINS

If URL parameters conflict with authorization:

BACKEND WINS

If a frontend calculation conflicts with backend financial values:

BACKEND WINS
7. Central Order Architecture

NanoPay revolves around one central order.

The order connects:

CLIENT
   ↓
PRODUCT
   ↓
MERCHANT
   ↓
ORDER
   ↓
SAVINGS / VAULT / CREDIT
   ↓
PAYMENT
   ↓
FINANCING
   ↓
QR
   ↓
WITHDRAWAL
   ↓
DELIVERY
   ↓
MERCHANT SETTLEMENT

Every order must have a unique identifier.

Example:

NP-2026-00001245

Do not create disconnected order representations.

8. Product Before Financing

The correct flow is:

PRODUCT
   ↓
ORDER
   ↓
FINANCING

Never build a financing process detached from a valid product and order.

Before starting financing, ensure the backend has validated the relevant:

Product
Merchant
Price
Order
Eligibility
9. Financing Modes

NanoPay has three financing mechanisms:

Épargne progressive
Coffre NanoPay
Crédit bancaire

Keep their flows distinct.

9.1 Épargne progressive
PRODUCT
 ↓
ORDER
 ↓
SAVINGS
 ↓
PAYMENTS
 ↓
100%
 ↓
QR
 ↓
MERCHANT
 ↓
WITHDRAWAL
 ↓
DELIVERY
9.2 Coffre NanoPay

The Coffre is intended for eligible employees whose bank credit profile has already been validated.

Do not implement it as a generic unrestricted wallet.

Possible choices include:

Use Coffre
Continue Savings
Switch to Bank Credit
9.3 Crédit bancaire

Keep these concepts separate:

CreditProfile
CreditRequest
Credit

The flow is:

PRODUCT
 ↓
ORDER
 ↓
CREDIT PROFILE
 ↓
CREDIT REQUEST
 ↓
BANK ANALYSIS
 ↓
APPROVED / REFUSED
 ↓
FINANCING
 ↓
QR
 ↓
MERCHANT
10. Financial Rules

Never make the frontend authoritative for financial calculations.

Do not independently determine:

Total
Interest
Penalty
Refund
Financing amount
Merchant commission
Bank commission
Settlement
Final balance

The backend must provide authoritative values.

The reference savings failure rule is:

Penalty = 15%
Refund = 85%

Savings extension can be allowed for a maximum of two months.

The frontend must display backend-provided results.

11. Money Handling

Prefer integer monetary units.

Example:

{
  "amount": 250000,
  "currency": "XOF"
}

Avoid floating-point financial calculations.

Do not rely on:

0.1 + 0.2

for financial truth.

Always make currency explicit when displaying financial values.

Example:

250 000 XOF
12. Payment Flow

Do not consider a Mobile Money success screen as final NanoPay confirmation.

The conceptual flow is:

Mobile Money
 ↓
Payment Infrastructure
 ↓
NanoPay / Financial Partner
 ↓
Validation
 ↓
Webhook
 ↓
Backend Update
 ↓
Frontend Update

The UI must reflect the backend-confirmed payment state.

13. Idempotency

Financial operations must be protected against duplicate execution.

Pay particular attention to:

Payment
Financing
Withdrawal
Merchant Settlement

Repeated requests must not create duplicate financial operations.

When required by the API:

Generate idempotency key
Send it with the request
Prevent duplicate UI submissions
Handle retries safely

Never implement blind retries for financial operations.

14. QR Code

QR is security-sensitive.

The frontend can:

Display QR
Open scanner
Scan QR
Send scan data
Display backend verification

The frontend cannot decide:

QR valid
QR expired
QR authorized
Withdrawal authorized
Merchant authorized
Order financed

The backend decides.

Correct flow:

FINANCING COMPLETE
 ↓
QR GENERATED
 ↓
MERCHANT SCANS
 ↓
BACKEND VERIFICATION
 ↓
WITHDRAWAL CONFIRMED
 ↓
MERCHANT SETTLEMENT
15. Merchant Settlement

Do not automatically pay a merchant simply because a QR was displayed.

Before settlement, the backend must validate the relevant transaction state.

The frontend only displays the resulting state.

16. API Architecture

Use:

Component
 ↓
Hook
 ↓
Service
 ↓
API Client
 ↓
Backend

Do not scatter:

fetch(...)

through UI components.

Centralize API communication.

Keep:

API URLs
Authentication handling
Request configuration
Error handling
Response normalization

in the appropriate service/API layer.

17. API Contract

Follow:

API-CONTRACT.md

Do not invent endpoint behavior.

If an endpoint is not confirmed by the backend, do not pretend that it is production-ready.

When the backend contract changes:

Update API layer
Update affected hooks
Update affected UI
Update documentation
Update tests

Keep frontend and backend contracts synchronized.

18. Mock Mode

Mock data may be used during development.

Keep mocks isolated from production services.

Example:

src/
 ├── api/
 ├── services/
 ├── hooks/
 └── mocks/

Never place fake financial values directly inside production business logic.

Never let mock data silently replace production API calls.

19. Authentication

NanoPay roles:

CLIENT
MERCHANT
BANK
ADMIN

Frontend route guards improve UX.

They are not security.

Frontend Guard ≠ Backend Authorization

Always expect the backend to enforce authorization.

20. Authorization

Never determine permissions solely from:

localStorage
URL
query parameters
frontend state
hidden buttons

For example:

/admin
/bank
/merchant

must remain protected by backend authorization.

If the backend returns:

401

handle authentication failure appropriately.

If the backend returns:

403

handle authorization failure appropriately.

21. Loading States

Every asynchronous feature needs an intentional loading state.

Examples:

Loading products...
Loading order...
Loading savings...
Loading credit profile...
Loading payment...

Avoid blank screens.

Prefer contextual loading states.

22. Error States

Never expose raw technical errors to users.

Avoid:

AxiosError
TypeError
500 Internal Server Error
undefined
Network Error

Translate them into useful messages.

Example:

Impossible de confirmer le paiement pour le moment.
Vérifiez votre connexion puis réessayez.

For financial operations, never hide an important failure.

23. Empty States

Every empty state should explain:

What is empty
Why it may be empty
What the user can do next

Example:

Aucun achat pour le moment.

Découvrez les produits disponibles et commencez
votre premier financement.

[Explorer les produits]
24. Critical Actions

Financial actions must require explicit confirmation.

Examples:

Confirm Payment
Submit Credit Request
Start Savings
Cancel Savings
Use Vault
Confirm Withdrawal
Confirm Delivery

Before confirmation, display relevant information.

Example:

Confirm Payment

Product: ...
Order: NP-2026-00001245
Amount: 250 000 XOF
Method: Mobile Money

[Cancel] [Confirm Payment]
25. Double Submission

Prevent duplicate submissions for critical actions.

When a user clicks:

Confirm Payment

the interface should immediately enter an appropriate processing state.

Use:

Loading
Disabled action
Idempotency
Backend protection

where applicable.

26. Order Lifecycle

Respect the documented lifecycle:

CART
 ↓
ORDER_CREATED
 ↓
FINANCING_IN_PROGRESS
 ↓
FINANCED
 ↓
READY_TO_DELIVER
 ↓
QR_GENERATED
 ↓
QR_SCANNED
 ↓
WITHDRAWAL_CONFIRMED
 ↓
DELIVERED
 ↓
MERCHANT_PAID
 ↓
COMPLETED

Do not invent conflicting statuses.

27. UI State Model

Support appropriate states:

IDLE
LOADING
SUCCESS
ERROR

Financial processes may also require:

PENDING
PROCESSING
CONFIRMED
FAILED
CANCELLED
REFUNDED

Never hide an important state transition.

28. Order Timeline

When displaying an order timeline, only mark events that the backend confirms.

Example:

✓ Commande créée
✓ Financement validé
✓ QR généré
● Retrait en attente
○ Livraison
○ Paiement commerçant
○ Terminée

Never fabricate completed steps.

29. Notifications

Notifications must correspond to real events.

Examples:

Payment confirmed
Savings updated
Credit approved
Credit refused
QR generated
Withdrawal confirmed
Delivery confirmed
Merchant paid
Order completed

Do not display success before backend confirmation.

30. Component Architecture

Prefer reusable components.

Examples:

Button
Input
Select
Modal
Card
Badge
Status
Progress
Table
Pagination
QRCode
Scanner
MoneyDisplay
OrderTimeline

Do not create giant components containing entire workflows.

Break complex interfaces into:

Page
Feature
Section
Component
31. Design System

Follow:

DESIGN-SYSTEM.md

Reuse shared:

Colors
Typography
Spacing
Radius
Shadows
Buttons
Inputs
Cards
Navigation
Status indicators
Tables
Motion

Do not create random one-off styles when a design-system primitive exists.

32. NanoPay Visual Identity

NanoPay should feel:

Premium
Modern
Precise
Fast
Financial
Trustworthy
Elegant

Do not make it look like a generic AI dashboard.

Avoid excessive:

Gradients
Glassmorphism
Purple AI styling
Huge rounded cards
Random shadows
Decorative effects
Giant headings
Unnecessary cards

Visual hierarchy must remain clear.

33. Design References

Interaction patterns may be studied from:

Linear
Stripe
Revolut
Apple
Vercel
Spotify

Use them only as inspiration.

Do not copy:

Brand identity
Proprietary assets
Distinctive layouts
Logos
Exact visual systems

NanoPay must have its own identity.

34. Responsive Design

Every feature must work on:

Mobile
Tablet
Desktop
Large Desktop

Test small screens explicitly.

Avoid:

Horizontal overflow
Tiny controls
Broken tables
Off-screen dialogs
Unusable financial actions
35. Accessibility

Follow accessibility best practices.

Ensure:

Semantic HTML
Keyboard navigation
Visible focus
Readable text
Adequate contrast
Accessible labels
Useful errors
Screen-reader compatibility

Do not communicate critical information using color alone.

Use:

Icon + Text

when appropriate.

36. Animation

Animation should have a purpose.

Good uses:

Page transitions
Navigation
Loading
Progress
Confirmation
QR states
Order progression
Modal transitions

Avoid animation that:

Distracts
Delays actions
Creates confusion
Hurts accessibility
Hurts performance

Prefer subtle and fast transitions.

37. Performance

Performance is a product requirement.

Watch for:

Unnecessary API calls
Duplicate requests
Unnecessary re-renders
Huge images
Large bundles
Heavy dependencies
Excessive polling
Heavy animations

Use appropriate techniques such as:

Lazy loading
Code splitting
Pagination
Debouncing
Memoization
Image optimization
Safe caching

Do not introduce unnecessary complexity.

38. Data Fetching

Avoid duplicate requests.

If several components need the same resource, use an appropriate shared query/state layer.

Example:

Order
 ↓
Shared query/state
 ↓
Component A
Component B
Component C

Do not blindly fetch the same resource independently.

For financial information, respect backend freshness requirements.

39. Sensitive Information

Treat these as sensitive:

Identity documents
Bank information
Credit information
Financial information
Authentication tokens
Personal information
Payment information

Do not:

Log sensitive data
Expose secrets in frontend code
Store unnecessary sensitive data
Display more information than required

Frontend source code is public.

40. Environment Variables

Use environment variables for public configuration such as:

API URL
Public configuration
Feature flags
Development configuration

Never expose:

Database credentials
Private API keys
Payment provider secrets
JWT signing secrets
Server credentials

Anything shipped to the browser should be considered public.

41. Security Documentation

Follow:

SECURITY.md

before implementing security-sensitive features.

Pay particular attention to:

Authentication
Authorization
XSS
CSRF
Sessions
Browser storage
Payment security
QR security
Sensitive data
File uploads
Third-party scripts
Dependencies
42. Forms

Forms must:

Validate input
Show errors
Handle backend errors
Show loading
Prevent duplicate submission
Preserve input where appropriate
Identify required fields

Never rely exclusively on frontend validation.

43. Backend Errors

Handle common backend states intentionally:

400
401
403
404
409
422
429
500
503
Network failure
Timeout

The exact handling should follow the actual API contract.

For financial conflicts such as:

Payment already processed
Order already financed
QR already used
Withdrawal already confirmed

display a clear state rather than simply showing a generic error.

44. Browser Refresh

Do not rely on in-memory state for important information.

After refresh:

Page
 ↓
Fetch authoritative backend state
 ↓
Render current state

Do not reconstruct financial truth from localStorage.

45. URL Parameters

Treat URL parameters as untrusted.

Example:

/orders/123

does not prove the current user can access order 123.

The backend must authorize access.

The frontend must handle unauthorized responses.

46. Local Storage

Do not use localStorage as the source of truth for:

Balance
Payment status
Credit approval
Order completion
Withdrawal authorization

Use it only where appropriate for non-sensitive client preferences or explicitly designed functionality.

47. Dependency Management

Before adding a dependency:

Check existing dependencies
Check whether an equivalent already exists
Check bundle impact
Check maintenance
Check security

Do not install a library for a problem that can be solved cleanly with existing project capabilities.

48. Code Style

Write code that is:

Readable
Explicit
Maintainable
Reusable
Testable
Consistent

Avoid unnecessary abstractions.

Avoid clever code that makes maintenance harder.

49. Naming

Use meaningful business names.

Good:

OrderStatus
SavingsProgress
CreditRequest
PaymentStatus
MerchantSettlement

Avoid:

data
info
thing
temp
x
test2

Use terminology consistently across the project.

50. Do Not Create Parallel Systems

Do not create:

Second API client
Second authentication system
Second order state
Second design system
Second money formatter
Second status system

when one already exists.

Reuse the project's established architecture.

51. Git

Before finishing a significant change:

git diff

Inspect the result.

Remove:

Debug logs
Temporary files
Unused imports
Unused dependencies
Temporary components
Fake production data

Keep changes focused.

52. Testing

Run the relevant checks after implementation.

At minimum, verify:

Build
Lint
Tests
Relevant routes
Relevant API calls

For UI changes, verify:

Mobile
Desktop
Loading
Success
Error
Empty

For financial operations, verify:

Duplicate submission
Payment failure
Network failure
Invalid order
Invalid QR
Unauthorized user
Wrong merchant
Wrong amount
53. Visual QA

After implementing an important screen, inspect it visually.

Check:

Spacing
Typography
Alignment
Hierarchy
Contrast
Buttons
Forms
Cards
Tables
Responsive behavior
Loading states
Error states
Empty states
Animations

Do not stop at:

"It compiles."

The interface must also look correct.

54. Quality Gate

Before declaring a feature complete:

[ ] Architecture respected
[ ] Business flow respected
[ ] API contract respected
[ ] Backend remains source of truth
[ ] Financial values are authoritative
[ ] Authentication works
[ ] Authorization works
[ ] Loading state exists
[ ] Error state exists
[ ] Empty state exists
[ ] Critical actions protected
[ ] Duplicate requests handled
[ ] Responsive
[ ] Accessible
[ ] Performance acceptable
[ ] Tests pass
[ ] No debug code
[ ] No secrets exposed
[ ] Design system respected
[ ] Existing features still work
55. When Requirements Are Ambiguous

Do not silently invent important behavior.

If ambiguity concerns:

Money
Credit
Payment
Authorization
QR
Withdrawal
Settlement
Order state

stop and inspect:

ARCHITECTURE.md
ARCHITECTURE-ESSENTIALS.md
API-CONTRACT.md
PRODUCT-FLOWS.md
SECURITY.md

If the requirement remains undefined, isolate the assumption and ask for clarification when necessary.

For purely visual details, make a reasonable design decision consistent with the design system.

56. When Backend and Frontend Disagree

If the backend behavior differs from the documentation:

inspect the actual API response
inspect the relevant service
inspect existing frontend assumptions
identify the discrepancy
do not fabricate a workaround that changes financial truth

For financial behavior, the backend remains authoritative.

Update the documentation only when the intended architecture has actually changed.

57. Final Response After Coding

After completing a task, report concisely:

Implemented:
- ...

Changed:
- ...

Tests:
- ...

Verification:
- ...

Remaining:
- ...

Do not claim something was tested if it was not tested.

Do not claim an API integration works if it was only mocked.

Be precise about what was actually verified.

58. Final Principle

Every implementation decision should preserve this architecture:

                    BACKEND
                       │
                       ▼
               SOURCE OF TRUTH
                       │
                       ▼
                     API
                       │
                       ▼
                  FRONTEND
                       │
              ┌────────┴────────┐
              │                 │
         EXPERIENCE        INTERACTION
              │                 │
              └────────┬────────┘
                       ▼
                      USER

The goal is not merely to make NanoPay functional.

The goal is to make it:

Reliable
Understandable
Secure
Fast
Premium
Production-ready

while preserving the integrity of the financial architecture.

BACKEND = TRUTH
FRONTEND = EXPERIENCE