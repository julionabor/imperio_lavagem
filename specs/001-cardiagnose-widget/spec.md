# Feature Specification: CarDiagnose Widget

**Feature Branch**: `001-cardiagnose-widget`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "CarDiagnose widget com diagnóstico guiado de sintomas e recomendações de serviços"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided Diagnosis to Service Recommendation (Priority: P1)

A car owner visits the Império da Lavagem website unsure of which service their car needs. They launch the CarDiagnose widget and are guided through 5 steps: choosing their primary concern, selecting their vehicle type, customising the vehicle's colour, answering targeted diagnostic questions, and finally receiving a personalised service pack recommendation with a direct booking link.

**Why this priority**: This is the core value proposition of the feature. Without completing this flow end-to-end, the widget delivers no business value.

**Independent Test**: Can be fully tested by completing all 5 steps starting from a fresh widget load and verifying that the result screen displays a recommended pack with a booking CTA.

**Acceptance Scenarios**:

1. **Given** a user on the site, **When** they complete all 5 steps of the widget, **Then** they see a clearly identified recommended service pack with its price and a button linking to the online booking page.
2. **Given** a user who has selected a pain category and vehicle type, **When** they reach Step 4, **Then** the diagnostic questions shown are relevant to the pain category they chose in Step 1.
3. **Given** a user on any step beyond Step 1, **When** they click the back button, **Then** they return to the previous step with their prior selections preserved.
4. **Given** a user who selects SUV, Carrinha, or Monovolume as vehicle type, **When** they reach the result screen, **Then** the displayed price includes a +2,50 € surcharge.

---

### User Story 2 - Emotional Vehicle Visualisation (Priority: P2)

As a car owner progresses through the widget, they see a 3D model of their own vehicle type update in real time. When they select their vehicle's colour in Step 3, the 3D model's body paint changes immediately, creating a personal emotional connection before the recommendation is revealed.

**Why this priority**: The 3D visualisation is a key differentiator from competitor sites and drives engagement and trust in the recommendation. However, the core diagnosis flow still works without it (via static fallback), so it is P2.

**Independent Test**: Can be fully tested by selecting a vehicle type (Step 2) and then selecting different colours (Step 3) and verifying the 3D model updates accordingly.

**Acceptance Scenarios**:

1. **Given** a user who selects a vehicle category in Step 2, **When** the step loads, **Then** a 3D model matching that category appears within 3 seconds.
2. **Given** a user on Step 3 who selects a colour from the palette, **When** the colour is clicked, **Then** the 3D model's bodywork updates to that colour within half a second.
3. **Given** a user on a device where 3D rendering is unavailable, **When** they reach Step 2 or 3, **Then** a static silhouette image of the selected vehicle category is shown instead.

---

### User Story 3 - Motorcycle Owner Separate Flow (Priority: P3)

A motorcycle owner who selects "Mota" as their vehicle type is routed through a simplified flow that displays the motorcycle service options with their fixed prices, bypassing the standard 4-step diagnostic questionnaire.

**Why this priority**: Motorcycles represent a smaller but real customer segment. The pricing and services differ fundamentally from cars, requiring a distinct but simple flow.

**Independent Test**: Can be fully tested by selecting "Mota" in Step 2 and verifying the result screen shows motorcycle-specific pricing.

**Acceptance Scenarios**:

1. **Given** a user who selects Mota in Step 2, **When** they proceed, **Then** they are shown motorcycle service options with their prices (25 € for up to 125 cc, 30 € above 125 cc) and a booking CTA.
2. **Given** a user who selects Mota, **When** the result is shown, **Then** no SUV surcharge logic is applied and no standard pack hierarchy is displayed.

---

### User Story 4 - Restart Without Page Reload (Priority: P3)

A user who has completed or partially completed the widget can restart from the beginning without refreshing the browser page, allowing them to try a different scenario.

**Why this priority**: Enables exploration behaviour and repeat use (e.g., checking what pack a different pain category would yield) without UX friction.

**Independent Test**: Can be fully tested by completing the flow to Step 5, clicking "Recomeçar", and verifying the widget resets to Step 1 with all fields cleared.

**Acceptance Scenarios**:

1. **Given** a user on the result screen (Step 5), **When** they click "Recomeçar o diagnóstico", **Then** the widget resets to Step 1 and all previous selections are cleared.

---

### Edge Cases

- What happens when a user tries to advance to the next step without making a selection? The "Seguinte" button remains inactive until a required selection is made.
- What happens if a user selects "Outra" for vehicle colour and does not pick a colour from the native picker? The model retains the default grey colour and the user can still proceed.
- How does the system handle a user whose pain category and diagnostic score produce a borderline result between two tiers? The recommendation engine always rounds up to the nearest principal pack — it never rounds down.
- What happens when the booking link (buk.pt) is unavailable? The CTA button still renders; the link opens in a new tab and the external service's own error page handles the failure.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The widget MUST guide users through exactly 5 sequential steps: (1) Pain Category, (2) Vehicle Type, (3) Colour Personalisation, (4) Diagnostic Questionnaire, (5) Recommendation Result.
- **FR-002**: Step 1 MUST present 6 selectable pain categories, each with a visual icon and a one-line description, in Portuguese.
- **FR-003**: Step 2 MUST present 6 vehicle type options; selecting one MUST load the corresponding 3D model in a dedicated visual panel.
- **FR-004**: Step 3 MUST offer a palette of 12 predefined colours plus a custom colour option; selecting a colour MUST update the 3D model's bodywork in real time.
- **FR-005**: Step 4 MUST display 3 to 6 diagnostic questions specific to the pain category selected in Step 1, with a progress indicator showing how many questions remain.
- **FR-006**: Each diagnostic question MUST offer exactly 3 answer options with increasing severity; the total score across all answers MUST be computed automatically.
- **FR-007**: The recommendation engine MUST produce one primary pack recommendation and one alternative pack for every valid combination of pain category and score.
- **FR-008**: Packs from the three principal tiers (Pack Diamante variants, Higienização Premium, Higienização Standard) MUST be recommended in at least 75% of all possible pain category and score combinations.
- **FR-009**: For SUV, Carrinha, and Monovolume vehicle types, the displayed price MUST automatically include a +2,50 € surcharge.
- **FR-010**: For any recommended pack priced at 100 € or more, the result screen MUST display an instalment option of 4 equal payments with no interest.
- **FR-011**: The primary CTA button on the result screen MUST open the booking page (imperiodalavagemauto.buk.pt) in a new browser tab.
- **FR-012**: The widget MUST be resettable to Step 1 from the result screen without a page reload.
- **FR-013**: If the user selects Mota as vehicle type, the widget MUST skip the standard diagnostic questionnaire and display the motorcycle-specific service table with its pricing.
- **FR-014**: Each step MUST include a back navigation control that returns the user to the previous step with their prior selections intact.
- **FR-015**: If 3D rendering is unavailable on the user's device, the widget MUST display a static SVG silhouette of the selected vehicle category as a fallback.

### Key Entities *(include if feature involves data)*

- **Pain Category**: The primary concern a user selects in Step 1 (e.g., exterior dirt, interior condition, odour, paint scratches, protection, full renewal). Determines which diagnostic questions are shown.
- **Vehicle Type**: The category of the user's vehicle (city car, saloon, SUV, estate, MPV, motorcycle). Determines the 3D model loaded and whether a surcharge applies.
- **Diagnostic Score**: The numeric total derived from the user's answers in Step 4. Combined with Pain Category to determine the pack recommendation.
- **Service Pack**: A named detailing service offering with a price range, a list of included treatments, a tier (principal, secondary, residual), and eligibility for instalment payment.
- **Recommendation**: The output of the engine — one primary Service Pack and one alternative Service Pack — personalised with a justification sentence referencing the user's inputs.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 60% of users who start the widget (Step 1) complete it through to the result screen (Step 5).
- **SC-002**: At least 30% of users who reach the result screen click the booking CTA.
- **SC-003**: The average order value of bookings originating from the widget is at least 20% higher than the site's current average booking value.
- **SC-004**: At least 75% of all recommendation outcomes display a pack from the three principal tiers (Pack Diamante variants, Higienização Premium, Higienização Standard).
- **SC-005**: Users complete the full 5-step flow in an average session time between 2 and 4 minutes.
- **SC-006**: The widget is fully functional on screens from 375 px wide (mobile) to 1920 px wide (desktop) with no broken layout or lost functionality.
- **SC-007**: Users can reach the result screen on a standard mobile connection in under 3 seconds of total load time for the widget assets.

---

## Assumptions

- The widget is embedded within or alongside the existing Império da Lavagem website; it does not require a separate domain or hosting environment.
- All service pack names, prices, and descriptions are as defined in the CarDiagnose_Spec_v1.md reference document and are subject to change only by the business owner.
- The booking system at imperiodalavagemauto.buk.pt is managed externally; the widget only links to it and does not integrate with its API.
- No user account, login, or personal data storage is required for V1; the widget operates entirely without collecting or persisting user information.
- Lead capture (email collection) and WhatsApp pre-fill are out of scope for V1 and are planned for a future version.
- Analytics event tracking per step is out of scope for V1 but is a planned V2 enhancement.
- The business phone number (96 44 550 06) and Instagram contact displayed on the result screen are current and maintained by the business owner.
- 3D model assets (.glb files) for each vehicle category will be sourced and optimised separately before development of Step 2 and Step 3 begins.
