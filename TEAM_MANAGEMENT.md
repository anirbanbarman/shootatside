# Team Management Implementation

## Overview

The application uses a client-side `ProjectProvider` and browser `localStorage` for the current demo workflow. Team registrations, projects, event interests, event teams, and the current session persist in the browser.

## Team Registration

The `/team` route shows the team login screen until an approved team account logs in. The registration form collects:

- Full name
- Mobile number
- WhatsApp number
- Email
- Address
- Aadhar file selection
- Selfie file selection
- PhonePe number
- User Type: `Team Leader` or `Member`
- One or more preferred team roles

The available preferred roles are:

1. Team Leader
2. Candid Photographer
3. Group Photo taker
4. Traditional photo taker
5. Couple Photo taker
6. Cinematographer
7. Reel Maker
8. Teaser Maker
9. Halping Hand
10. Drone operator
11. Live Video
12. Sound Operator
13. Driver

Files are currently stored as selected filenames only. Real file storage requires a backend or upload service.

## Admin Registration Approval

Admin opens `/admin`, selects **Team Management**, then **Team Registration**.

For each registration, admin can:

- Review contact details and selected role preferences
- Accept the registration
- Set a username and password
- Reject the registration

Only accepted registrations with matching credentials can log in and view events.

## Event Interest Requests

An approved team member can request interest in a confirmed event.

Rules:

- Multiple team members can request the same event.
- Each project stores `teamInterest` as a list.
- Admin sees every member request separately.
- Admin can filter requests by event date.
- Admin can accept or reject each member independently.
- Team members see their own request as `Pending`, `Approved`, or `Rejected`.
- A team member cannot have more than one pending or accepted event request on the same date. The team portal shows a popup when the rule is violated.

Older localStorage data with one interest object is migrated to the new list format when the provider loads.

## Team Hierarchy Builder

Admin opens **Team Management > Team Hierarchy**. Events can be filtered by date, and every event has its own **Make My Team** builder.

The builder supports two explicit member types:

### Interested Member

- Added with **Add Interested Member**.
- Selected from interested members for that event.
- Name and phone are populated from registration and disabled.
- Role dropdown contains only roles selected during registration.

### Custom Member

- Added with **Add Team Member**.
- Name is an editable input.
- Phone number is an editable input.
- Role dropdown contains the complete role list.

Both member types can be mixed in one event team. Each row can be removed, and **Save Team** persists the event roster.

## Event Team Graph

After an event team is saved, its hierarchy graph appears directly below that event card.

The graph displays:

1. Event root with event type, date, and client
2. Team Leader nodes below the event
3. Other team members below the leader level
4. Each person’s name, phone number, and assigned role

The graph is event-specific, so each event card shows only its own assigned team.

## Team Portal Visibility

Team portal event access is role-aware and time-limited. The event team assignment determines whether the logged-in person is a `Team Leader` or another team member.

- Before the event enters the seven-day window, assigned members do not see client contact details or the event address.
- From seven days before the event through the event date, a Team Leader can see the client name, client phone, event address, and the assigned members under that leader.
- From seven days before the event through the event date, other assigned members can see only the Team Leader name and phone number.
- Other members do not see any client details.
- An approved interested member who has not been assigned to the event sees an assignment-pending message.

## Client Team Call Details

After the admin creates an event team, the client can set a team call time and call venue from the client project details. The saved values are visible to admin and assigned team members. Team members see them within the existing seven-day event visibility window. The client sees the assigned Team Leader name and phone within that same window.

## Event-Day Live Tracker

Admin can open **Team Management > Live Event Tracker** for events with a saved team.

- Admin can add checklist tasks for the event.
- Admin can see the Team Leader arrival timestamp.
- Admin can see each assigned member's joined/not-joined state and timestamp.
- Admin can mark checklist tasks complete; completion timestamps are stored.
- Admin can review delay or issue notes from the Team Leader.
- Admin and Team Leader can exchange messages in the event tracker chat.

On the event date, the assigned Team Leader can:

- Mark that they have reached the event.
- Mark each assigned member as joined using checkboxes.
- Complete the admin-created event checklist items.
- Write and save a delay or issue note.
- Send messages to the admin.

Each assigned member can also check in individually from their own team portal. The same `memberJoinedAt` timestamp is stored whether the member checks in personally or the Team Leader checks them in, so admin sees the source-independent attendance state and time.

All tracker state is stored on the project in `eventTracker` and persists through browser `localStorage` in the current demo implementation.

## Data Model

Important fields include:

- `TeamRegistration.preferredRoles`
- `Project.teamInterest[]`
- `Project.eventTeam[]`
- `EventTeamMember.member`
- `EventTeamMember.memberPhone`
- `EventTeamMember.role`
- `EventTeamMember.date`

## Validation

The current implementation has been validated with:

```bash
npx tsc --noEmit
npm run build
```

The project is a demo/localStorage implementation. Production multi-user access requires a server database, authentication, and real file storage.
