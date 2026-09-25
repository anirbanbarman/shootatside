# Team Management Implementation

Last updated: 25 September 2026

## Overview

The application uses a client-side `ProjectProvider` and browser `localStorage` for the current demo workflow. Team registrations, projects, event interests, event teams, client briefing details, tracker data, and the current session persist in the browser.

Main screens:

- `/team`: team login, registration, approved member event portal, and event-day controls.
- `/admin`: admin login, project management, team management, hierarchy builder, and live tracker.
- `/client`: client project portal, team call details, and assigned leader contact.

Admin Team Management sections are URL-addressable through the `section` query parameter, so refresh and browser navigation preserve the selected section:

- `/admin?section=registrations`
- `/admin?section=interests`
- `/admin?section=hierarchy-builder`
- `/admin?section=live-tracker`

The admin sidebar also provides an explicit logout action. The team portal has its own logout action.

## Portal Layout and Routing

Authenticated admin, client, and team screens use the shared `PortalShell` component. The shell provides:

- A full-width header with brand, portal title, current user, and logout.
- A left navigation panel with role-specific links.
- A central routed content area for the dashboard.
- A right contextual information panel on wide screens.
- A full-width footer.

The right panel collapses on smaller screens, and the left navigation becomes a horizontal mobile navigation strip.

The main portals remain separate routes:

- `/admin`
- `/client`
- `/team`

Admin Team Management subsections are route-addressable with query parameters so each section can be refreshed or linked directly:

- `/admin?section=registrations`
- `/admin?section=interests`
- `/admin?section=hierarchy-builder`
- `/admin?section=live-tracker`

## Session Switching

Admin, client, and team active sessions are stored in per-tab `sessionStorage`, while shared project and team data remains in `localStorage`. An admin tab and a team tab can therefore stay logged in independently; logging in as team no longer logs the admin out in another tab. Route guards still verify the required role before rendering each portal.

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

The User Type is the hierarchy identity. Preferred roles are event duties and may contain roles such as `Cinematographer`, `Drone operator`, or `Team Leader`.

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

After acceptance, the team member can log in only with the username and password assigned by admin. Pending and rejected registrations cannot access events.

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
- User Type is populated from registration but remains an editable dropdown for admin.
- The interested-member selector populates name and phone from registration.
- Populated name and phone are disabled for interested rows.
- Role dropdown contains only roles selected during registration.

### Custom Member

- Added with **Add Team Member**.
- Name is an editable input.
- Phone number is an editable input.
- User Type is an editable dropdown containing `Team Leader` and `Member`.
- Role dropdown contains the complete role list.

Both member types can be mixed in one event team. The **Add Interested Member** button disappears after all interested members for the event have been selected. Each row can be removed, and **Save Team** persists the event roster.

## Event Team Graph

After an event team is saved, its hierarchy graph appears directly below that event card.

The graph displays:

1. Event root with event type, date, and client
2. `Team Leader` user-type nodes below the event
3. `Member` user-type nodes below the leader level
4. Each person’s name, phone number, user type, and assigned role

The graph hierarchy is based on `EventTeamMember.userType`, not on the selected event duty role. Older saved event teams without `userType` fall back to the old `Team Leader` role value.

The graph is event-specific, so each event card shows only its own assigned team.

## Team Portal Visibility

Team portal event access is role-aware and time-limited. The event team assignment determines whether the logged-in person is a `Team Leader` or another team member.

- Before the event enters the seven-day window, assigned members do not see client contact details or the event address.
- From seven days before the event through the event date, a Team Leader can see the client name, client phone, event address, and the assigned members under that leader.
- From seven days before the event through the event date, other assigned members can see only the Team Leader name and phone number.
- Other members do not see any client details.
- An approved interested member who has not been assigned to the event sees an assignment-pending message.

## Client Team Call Details

After the admin creates an event team, the client can set a team call time and call venue from the client project details. The client form is available only after a team exists.

- Admin can see the saved call time and call venue in project details.
- Assigned team members can see the saved call details within the seven-day event window.
- The client sees the assigned Team Leader name and phone within the same seven-day window.
- The values are stored in `Project.teamBrief`.

## Event-Day Live Tracker

Admin can open **Team Management > Live Event Tracker** for events with a saved team.

The tracker shows only events whose event date is today by default. **Show All Trackers** reveals other event dates in read-only mode.

- Admin can add checklist tasks for the event.
- Admin can see the Team Leader arrival timestamp.
- Admin can see each assigned member's joined/not-joined state and timestamp.
- Admin can mark checklist tasks complete; completion timestamps are stored.
- Admin can review delay or issue notes from the Team Leader.
- Admin and Team Leader can exchange messages in the event tracker chat.

When all trackers are shown, inputs and action controls are disabled for non-today events. This prevents future or historical events from being edited accidentally.

On the event date, the assigned Team Leader can:

- Mark that they have reached the event.
- Mark each assigned member as joined using checkboxes.
- Complete the admin-created event checklist items.
- Write and save a delay or issue note.
- Send messages to the admin.

Each assigned member can also check in individually from their own team portal. The same `memberJoinedAt` timestamp is stored whether the member checks in personally or the Team Leader checks them in, so admin sees the source-independent attendance state and time.

The member check-in is stored using the assigned event-team email, which keeps the team portal and admin dashboard synchronized.

All tracker state is stored on the project in `eventTracker` and persists through browser `localStorage` in the current demo implementation.

## Data Model

Important fields include:

- `TeamRegistration.preferredRoles`
- `Project.teamInterest[]`
- `Project.eventTeam[]`
- `EventTeamMember.member`
- `EventTeamMember.memberPhone`
- `EventTeamMember.role`
- `EventTeamMember.userType`
- `EventTeamMember.date`
- `Project.teamBrief`
- `Project.eventTracker`
- `EventTracker.memberJoinedAt`
- `EventTracker.tasks[].completedAt`
- `EventTracker.messages[]`

## Important Business Rules

- Only accepted registrations can log in.
- Multiple members can request the same event.
- A member cannot have multiple pending or accepted event requests on the same date.
- Admin accepts or rejects interest requests independently per member.
- Event hierarchy can contain both interested and custom members.
- Interested members use their registration role preferences; custom members use the complete role list.
- User Type controls hierarchy and portal visibility. Event role controls the person’s duty.
- Sensitive team details unlock from seven days before the event through the event date.
- Team Leaders see client name, client address, client phone, and assigned members.
- Members see only Team Leader name and Team Leader phone; they do not see client details.

## Validation

The current implementation has been validated with:

```bash
npx tsc --noEmit
npm run build
```

The project is a demo/localStorage implementation. Production multi-user access requires a server database, authentication, and real file storage.
