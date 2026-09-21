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
