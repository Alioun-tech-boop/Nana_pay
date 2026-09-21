# AGENTS.md

# NanoPay — Frontend AI Agent Instructions

## 1. Mission

You are an AI coding agent working on the NanoPay frontend.

Your mission is to build and maintain a:

- premium
- modern
- fast
- secure
- responsive
- accessible
- production-ready

financial interface.

The frontend must make NanoPay's financial operations simple to understand and use without becoming the source of financial truth.

```text
BACKEND = SOURCE OF TRUTH
FRONTEND = USER EXPERIENCE
2. Mandatory Reading

Before modifying the project, read and understand:

ARCHITECTURE.md
ARCHITECTURE-ESSENTIALS.md
API-CONTRACT.md
DESIGN-SYSTEM.md
SECURITY.md
PRODUCT-FLOWS.md
QA-CHECKLIST.md
README-FRONTEND.md
OPENCODE.md

Do not begin implementation before understanding the relevant documentation.

If documentation conflicts with existing implementation, inspect the backend/API contract and existing code before deciding how to proceed.

Never silently invent a business rule.

3. Golden Rule
NEVER TRUST THE CLIENT

The browser is untrusted.

Never consider frontend state authoritative for:

money
balances
prices
discounts
financing
credit decisions
payment confirmation
QR validity
withdrawal authorization
merchant settlement
permissions
final order status

The backend decides.

The frontend displays and interacts with those decisions.

4. Agent Workflow

Every significant task must follow:

1. INSPECT
2. UNDERSTAND
3. PLAN
4. IMPLEMENT
5. TEST
6. VERIFY
7. POLISH

Do not immediately start rewriting files.

First inspect:

project structure
package configuration
existing components
routing
state management
API layer
hooks
styles
assets
environment configuration
tests
existing documentation

Prefer extending existing architecture over creating parallel systems.

5. Preserve Working Code

Do not unnecessarily rewrite working code.

Before modifying a component:

Understand why it exists
Understand who uses it
Understand its dependencies
Understand its API
Understand its visual role

Do not:

delete working features without reason
rename large groups of files unnecessarily
replace libraries without justification
introduce duplicate architecture
break existing routes
break existing API integrations
remove useful tests
replace real data with fake data

Make the smallest coherent change that solves the problem.

6. Architecture

Follow the architecture:

UI
 ↓
Page
 ↓
Feature
 ↓
Hook / State
 ↓
Service
 ↓
API Client
 ↓
Backend

Avoid:

Component
 ↓
random fetch()

HTTP requests must go through the centralized API layer.

Business logic should not be duplicated across components.

7. Central Order Principle

NanoPay is organized around one central order.

Every relevant operation must remain connected to:

Client
Product
Merchant
Price
Order
Savings
Vault
Credit
Payment
QR
Withdrawal
Delivery
Merchant Settlement

Every order has one unique identifier.

Example:

NP-2026-00001245

Do not create disconnected representations of the same order.

8. Product Before Financing

The correct conceptual flow is:

PRODUCT
 ↓
ORDER
 ↓
FINANCING

Never build a financing flow that is detached from a valid product/order.

The frontend must obtain authoritative product and pricing information from the backend.

9. Financing Modes

NanoPay has three financing mechanisms:

Épargne progressive
Coffre NanoPay
Crédit bancaire

Do not merge them into one generic financial flow when their business rules differ.

Savings
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
Vault

The Coffre NanoPay is intended for eligible employees whose bank credit profile has already been validated.

Do not represent it as a generic unrestricted wallet.

Credit

Keep these concepts separate:

CreditProfile
CreditRequest
Credit

Do not merge them into one frontend object simply for convenience.

10. Financial Logic

Financial calculations must not be trusted from the frontend.

The frontend must never independently determine authoritative:

Total Price
Financing Amount
Interest
Penalty
Refund
Merchant Commission
Bank Commission
Savings Progress
Final Balance
Settlement Amount

The backend must return authoritative values.

The frontend may calculate temporary presentation values only when appropriate, but they must never override backend values.

11. Money

Represent money using integer minor units whenever the API requires it.

Example:

{
  "amount": 125000,
  "currency": "XOF"
}

Do not use floating-point arithmetic for authoritative financial calculations.

Bad:

const total = 0.1 + 0.2;

Prefer backend-provided financial values.

Always display the currency clearly.

12. Savings Rules

The reference savings failure rule is:

Penalty = 15%
Refund = 85%

The backend is responsible for the authoritative calculation.

The frontend displays the values returned by the backend.

Savings extension may be allowed for a maximum of two months.

The frontend must not invent:

extension duration
deadline
penalty
refund
eligibility

These values must come from the backend.

13. Payment Rules

The frontend must never assume that a Mobile Money interface returning success means NanoPay has confirmed the payment.

Conceptually:

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

The UI must reflect the backend-confirmed payment status.

14. Idempotency

Financial operations must be protected against duplicate execution.

Pay particular attention to:

Payment
Financing
Withdrawal
Merchant Settlement

A repeated request must not accidentally create a second financial operation.

When the API requires an idempotency key, generate and send one correctly.

Never blindly retry a financial operation without understanding its idempotency behavior.

15. QR Security

QR operations are security-sensitive.

The frontend may:

Display QR
Open Scanner
Scan QR
Send QR Data
Display Verification Result

The frontend must never decide:

QR is valid
QR is expired
QR is authorized
Withdrawal is authorized
Merchant is authorized
Order is financed

The backend decides.

Correct flow:

QR GENERATED
 ↓
MERCHANT SCANS
 ↓
BACKEND VERIFICATION
 ↓
WITHDRAWAL CONFIRMED
 ↓
MERCHANT SETTLEMENT
16. Merchant Settlement

Merchant payment must occur only after the appropriate backend-confirmed withdrawal.

Never implement:

QR displayed
 ↓
Merchant automatically paid

The backend must validate the relevant transaction state.

The frontend only presents the resulting state.

17. Order Lifecycle

Respect the central lifecycle:

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

If the backend provides different enum names, synchronize the frontend with the actual API contract rather than creating an independent lifecycle.

18. Authentication

NanoPay has four main roles:

CLIENT
MERCHANT
BANK
ADMIN

Frontend route guards are useful for user experience.

They are not a security boundary.

Frontend Guard ≠ Backend Authorization

The backend must enforce all permissions.

Never assume that hiding a button provides authorization.

19. Authorization

Never grant permissions based solely on:

localStorage
URL parameters
query parameters
frontend state
hidden buttons
React/Vue/etc. conditions

A user manipulating the browser must not gain access to protected operations.

For example:

/admin
/bank
/merchant

must be protected by backend authorization.

20. API Rules

All API calls must use the centralized API client/service architecture.

Preferred:

Component
 ↓
Hook
 ↓
Service
 ↓
API Client
 ↓
Backend

Avoid:

Component
 ↓
fetch()

Do not scatter API URLs throughout the application.

Use environment configuration for configurable API endpoints.

Never hardcode production secrets.

21. API Contract

Use the definitions in:

API-CONTRACT.md

Do not invent API behavior.

If an endpoint is not confirmed by the backend:

Do not pretend it exists.

If implementation requires an endpoint that is missing:

identify the requirement
document the required contract
keep the frontend implementation isolated
clearly mark the integration dependency

Never silently fabricate production API responses.

22. Mock Data

Mock data is allowed for development.

Keep mocks isolated.

Preferred:

src/
  mocks/
  services/
  api/

Do not embed fake financial values inside production business logic.

Never let mock logic accidentally become the production source of truth.

Use an explicit development/mock mode when possible.

23. Loading States

Every asynchronous operation must have an intentional loading state.

Examples:

Loading products...
Loading order...
Loading savings...
Loading credit profile...
Loading payment status...

Do not leave users staring at a blank page.

Prefer contextual loading states instead of replacing the entire interface unnecessarily.

24. Error States

Errors must be understandable.

Avoid exposing raw technical errors such as:

500 Internal Server Error
AxiosError
TypeError
undefined
Network Error

Translate technical failures into useful user-facing messages.

Example:

Impossible de confirmer le paiement pour le moment.
Veuillez vérifier votre connexion puis réessayer.

Never hide important financial errors.

25. Empty States

Empty states must explain:

What is empty
Why it is empty when useful
What the user can do next

Example:

Aucun achat pour le moment.

Découvrez les produits disponibles et commencez
votre premier financement.

[Explorer les produits]

Avoid empty screens with no guidance.

26. UI State Machine

Asynchronous interfaces should support:

IDLE
 ↓
LOADING
 ↓
SUCCESS

or:

IDLE
 ↓
LOADING
 ↓
ERROR

Financial processes may additionally use:

PENDING
PROCESSING
CONFIRMED
FAILED
CANCELLED
REFUNDED

Do not use vague states such as:

maybe
almost
done-ish

Use explicit state names.

27. Critical Actions

Financially important actions require explicit user intent.

Examples:

Confirm Payment
Submit Credit Request
Start Savings
Cancel Savings
Use Vault
Confirm Withdrawal
Confirm Delivery

Before confirmation, show the relevant consequences.

Example:

Confirm Payment

Product: ...
Order: NP-2026-00001245
Amount: 250 000 XOF
Method: Mobile Money

[Cancel] [Confirm Payment]

Do not hide important financial consequences.

28. Double-Click Protection

Prevent accidental repeated execution of critical actions.

For example:

Confirm Payment

should not trigger two requests because the user clicked twice.

Use:

disabled state
loading state
idempotency
backend protection

when appropriate.

29. Sensitive Data

Do not expose sensitive information unnecessarily.

Be careful with:

Identity documents
Bank information
Credit information
Financial information
Authentication tokens
Personal information
Payment information

Do not log sensitive values to the browser console.

Do not place secrets in frontend environment variables that are exposed to the browser.

Remember:

Frontend code is public.
30. Security

Follow:

SECURITY.md

At minimum, consider:

XSS
CSRF where applicable
authentication
authorization
session security
secure API communication
input validation
file upload security
dependency security
third-party scripts
sensitive data exposure
browser storage
financial action confirmation

Never rely on frontend validation as the only security layer.

Frontend validation = UX protection
Backend validation = Security protection
31. Design System

Follow:

DESIGN-SYSTEM.md

Do not create random styles for every component.

Use shared:

Colors
Typography
Spacing
Radii
Shadows
Buttons
Inputs
Cards
Tables
Navigation
Status indicators
Motion

A new component should reuse existing primitives whenever possible.

32. Visual Identity

NanoPay must feel like a serious premium financial product.

Target qualities:

Premium
Modern
Precise
Fast
Financial
Trustworthy
Elegant

Do not create a generic AI dashboard.

Avoid excessive:

Gradients
Glassmorphism
Rounded cards
Decorative shadows
Purple AI aesthetics
Animations
Giant headings
Unnecessary cards

The interface should prioritize hierarchy and clarity.

33. Inspiration

When designing, it is acceptable to study interaction patterns from products such as:

Linear
Stripe
Revolut
Apple
Vercel
Spotify

Do not copy their branding, layouts, proprietary assets, or distinctive visual identity.

NanoPay needs its own visual identity.

34. Responsive Design

Every screen must work across:

Mobile
Tablet
Desktop
Large Desktop

Do not treat mobile as an afterthought.

Financial actions must remain easy to use on small screens.

Avoid:

horizontal overflow
tiny buttons
unreadable tables
broken dialogs
off-screen actions
35. Accessibility

Follow accessibility principles throughout development.

Ensure:

keyboard navigation
visible focus states
semantic HTML
readable text
sufficient contrast
accessible forms
meaningful labels
useful error messages
screen-reader-friendly controls

Do not communicate critical information through color alone.

For example:

Success
✓ Confirmed

Failure
! Failed

rather than relying only on green/red.

36. Animation

Animation should communicate state or improve interaction.

Use motion for:

Navigation
Loading
Confirmation
Progress
Modal transitions
QR states
Order progression

Avoid animation that:

delays important actions
distracts from financial information
reduces accessibility
causes performance problems
exists only for decoration

Prefer subtle, fast and purposeful transitions.

37. Performance

Performance is part of the product.

Watch for:

Unnecessary API requests
Unnecessary re-renders
Large images
Large bundles
Heavy dependencies
Excessive polling
Heavy animations
Duplicate requests

Use appropriate:

Lazy loading
Code splitting
Memoization
Caching where safe
Image optimization
Pagination
Debouncing

Do not optimize blindly.

Measure before introducing complicated optimization.

38. Data Fetching

Do not fetch the same data repeatedly without reason.

For example, if multiple components require the same order:

Order
 ↓
Shared state/query/cache
 ↓
Multiple consumers

rather than:

Component A → API
Component B → API
Component C → API

However, financial data must be refreshed according to the backend's consistency requirements.

Never use stale cached financial information when the operation requires current authoritative state.

39. Routing

Routes must reflect NanoPay's domain structure.

Examples may include:

/
 /marketplace
 /products/:id
 /orders/:id
 /savings/:id
 /vault
 /credit
 /profile
 /merchant
 /bank
 /admin

Actual routes must follow the project's implementation.

Do not create duplicate routes for the same business entity without a reason.

40. Components

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

Do not create a giant component containing the entire application.

Break complex screens into logical features.

41. Forms

Forms must:

validate input
display useful errors
preserve user input when appropriate
show loading state
prevent accidental duplicate submission
clearly identify required fields
handle backend validation errors

Never rely only on frontend validation.

42. Financial Display

Financial information must be extremely clear.

Always distinguish:

Amount
Currency
Status
Date
Transaction
Order

Avoid ambiguous numbers.

Example:

250 000 XOF

is preferable to:

250000

when the context does not already make the currency obvious.

43. Order Timeline

Where useful, display the order lifecycle clearly.

Example:

✓ Commande créée
✓ Financement validé
✓ QR généré
● Retrait en attente
○ Livraison
○ Paiement commerçant
○ Terminée

The timeline must reflect backend state.

Do not fabricate completed steps.

44. Notifications

Notifications should correspond to real backend events.

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

Do not display a success notification before the backend has confirmed the operation.

45. Bank Interface

The Bank is responsible for credit analysis.

The frontend may expose:

Client information
Documents
Credit profile
Credit request
Review interface
Approval action
Refusal action
Financing status

Do not make the Admin interface replace the Bank's credit-analysis role.

46. Admin Interface

Admin can supervise:

Users
Merchants
Products
Orders
Payments
Credits
Platform activity
Audit
Merchant validation

The frontend must not grant additional authority simply because a user can navigate to an admin page.

Backend authorization remains mandatory.

47. Merchant Interface

Merchant functionality may include:

Store management
Product management
Stock
Orders
QR scanning
Withdrawal verification
Delivery
Settlement tracking

Merchant payment must follow backend-confirmed withdrawal.

48. Testing

Before declaring a feature complete, test:

Happy path
Loading state
Error state
Empty state
Network failure
Unauthorized access
Invalid input
Repeated clicks
Refresh
Back navigation
Mobile layout
Desktop layout
API failure
Backend validation failure

For financial operations additionally test:

Duplicate request
Duplicate payment
Duplicate withdrawal
Invalid order
Invalid QR
Expired QR
Wrong merchant
Wrong amount
Unauthorized user
49. Browser Refresh

Important user flows must survive browser refresh where appropriate.

Never assume that in-memory frontend state will always exist.

After refresh, retrieve authoritative state from the backend.

Example:

Refresh Order Page
 ↓
Fetch Order
 ↓
Fetch Current Status
 ↓
Render Current State

Do not restore financial truth solely from localStorage.

50. URL Parameters

Treat URL parameters as untrusted input.

Never assume:

/orders/123

means the current user is authorized to see order 123.

The backend must validate access.

The frontend should handle unauthorized responses cleanly.

51. Local Storage

Do not store sensitive information unnecessarily in:

localStorage
sessionStorage
cookies

Never use local storage as the authoritative source for:

Balance
Payment status
Credit approval
Order completion
Withdrawal authorization
52. Environment Variables

Never commit secrets.

Use environment variables for configurable values such as:

API URL
public configuration
feature flags
development configuration

Do not expose:

Private API keys
Server secrets
Payment provider secrets
Database credentials
JWT signing secrets

to the browser.

53. Dependencies

Before adding a dependency:

check whether the project already has an equivalent
verify that the dependency is necessary
consider bundle size
consider maintenance
consider security
use it consistently if introduced

Do not add dependencies simply to solve a small problem that can be handled cleanly with existing tools.

54. Git Discipline

Keep changes focused.

Prefer commits that represent coherent changes.

Avoid mixing:

Feature
Major refactor
Formatting
Dependency replacement

into one unrelated change.

Before finishing:

git diff

must be inspected.

Remove:

debug code
temporary logs
accidental files
unused imports
unused dependencies
temporary mock data
55. Code Quality

Write code that is:

Readable
Predictable
Maintainable
Reusable
Testable
Consistent

Avoid unnecessary cleverness.

Prefer explicit code over abstractions that make simple operations difficult to understand.

56. Naming

Use meaningful names.

Good:

OrderStatus
SavingsProgress
CreditRequest
PaymentStatus
MerchantSettlement

Bad:

Data
Thing
Info
Temp
X
Test2

Use consistent terminology with the business architecture.

57. Business Terminology

Respect NanoPay terminology.

Use:

Épargne progressive
Coffre NanoPay
Crédit bancaire
CreditProfile
CreditRequest
Credit
Order
QR
Withdrawal
Merchant Settlement

Do not casually rename concepts in the UI or code.

58. Do Not Invent Business Rules

If the documentation says:

Penalty = 15%
Refund = 85%

implement the documented behavior.

If a rule is not documented:

Do not invent it.

Instead:

identify the missing rule
isolate the implementation
ask for clarification when necessary

For API behavior, prefer the actual backend contract.

59. Documentation Synchronization

If implementation changes the architecture or API contract, update the relevant documentation.

Potential files:

ARCHITECTURE.md
ARCHITECTURE-ESSENTIALS.md
API-CONTRACT.md
DESIGN-SYSTEM.md
SECURITY.md
PRODUCT-FLOWS.md
QA-CHECKLIST.md
README-FRONTEND.md

Documentation must not describe a completely different system from the code.

60. Definition of Done

A feature is not finished simply because it renders.

A feature is done when:

✓ Correct architecture
✓ Correct business flow
✓ Correct API integration
✓ Correct loading state
✓ Correct error state
✓ Correct empty state
✓ Responsive
✓ Accessible
✓ Secure
✓ Tested
✓ No unnecessary console errors
✓ No accidental mock data
✓ No broken existing functionality
✓ Visual quality verified
✓ Backend source of truth respected
61. Final Verification

Before completing a task, verify:

[ ] Application builds
[ ] Relevant tests pass
[ ] Routes work
[ ] API calls work
[ ] Authentication works
[ ] Authorization is respected
[ ] Loading states work
[ ] Errors work
[ ] Empty states work
[ ] Mobile layout works
[ ] Desktop layout works
[ ] Financial values come from backend
[ ] Critical actions cannot be accidentally duplicated
[ ] No secrets are exposed
[ ] No debug logs remain
[ ] No unnecessary dependencies were added
[ ] Design system is respected
[ ] Existing features still work
62. Final Quality Standard

Before considering the work complete, ask:

Does this respect the NanoPay architecture?

Does the backend remain the source of truth?

Is the financial information unambiguous?

Can the user understand what is happening?

What happens if the network fails?

What happens if the backend rejects the operation?

What happens if the user refreshes?

What happens if the user clicks twice?

What happens if someone manipulates the browser?

Does the interface work on mobile?

Does it look like a serious financial product?

Is the implementation maintainable?

If any critical answer is no, the task is not complete.

63. Core Principle

Always remember:

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
        ┌───────┴───────┐
        │               │
   EXPERIENCE       INTERACTION
        │               │
        └───────┬───────┘
                ▼
              USER

The frontend exists to make NanoPay's complex financial system understandable, usable and trustworthy.

BACKEND = TRUTH
FRONTEND = EXPERIENCE