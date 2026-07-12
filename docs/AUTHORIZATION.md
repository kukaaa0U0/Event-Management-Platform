# Authorization And Access Rules

This document captures the current platform authorization rules and the next
planned access-control improvements.

## User Roles

The domain already has these roles:

- `Participant` - registers for events and can view their own registrations later.
- `Organizer` - creates events, manages registrations, and performs check-in.
- `Admin` - manages the whole platform, including users, categories, and moderation.

## Event Ownership

Each event belongs to one organizer through `Event.OrganizerId`.

Current access rules:

- only `Organizer` and `Admin` accounts may create events;
- only the event organizer or an admin may update, publish, cancel, complete it, change event modes, or add tickets;
- only the event organizer or an admin may view the full registrations list;
- participants can see their own registration data through `GET /api/registrations/my`.

## Event Modes

Current event lifecycle:

```text
Draft -> Published -> Ongoing -> Completed
Draft/Published/Ongoing -> Cancelled
```

Planned event settings:

```text
RegistrationEnabled: true/false - implemented
CheckInEnabled: true/false - implemented
CheckInMode: OrganizerOnly / SelfCheckIn / EventCode
```

Initial recommended mode:

```text
OrganizerOnly
```

That means the participant receives a check-in code, but the organizer performs
the actual check-in from the event management screen.

## Authentication Plan

Implementation order:

1. Email/password registration and login. Done.
2. Password hashing. Done.
3. JWT access tokens. Done.
4. API authorization policies by role and event ownership. Initial backend enforcement is done.
5. Frontend login screen and authenticated API client. Done.
6. Self-registration role selection for `Participant` or `Organizer`. Done.
7. Seed admin account for local MVP checks. Done.
8. External OAuth login later, for example Yandex ID.

External OAuth should not be the first auth step because it adds provider
configuration, callback URLs, client secrets, and deployment-specific setup.

## API Policy Direction

Current restrictions:

- `POST /api/events` requires an authenticated `Organizer` or `Admin`.
- `GET /api/events/my` requires an authenticated user and returns their managed events.
- `GET /api/events/dashboard` requires an authenticated user and returns dashboard data for their managed events.
- `PUT /api/events/{id}` requires organizer ownership or admin role.
- `PUT /api/events/{id}/settings` requires organizer ownership or admin role.
- `POST /api/events/{id}/tickets` requires organizer ownership or admin role.
- event mutation endpoints require organizer ownership or admin role.
- `GET /api/events/{eventId}/registrations` requires organizer ownership or admin role.
- `GET /api/registrations/my` requires authentication and returns only the current user's registrations.
- `POST /api/check-in` requires organizer ownership or admin role.
- public event list/details may remain anonymous while the platform is in MVP mode.

Temporary MVP exception:

- public event list/details and participant registration remain anonymous for MVP.
- if participant registration includes a JWT, the registration is attached to the authenticated account.
- organizer workflows are protected in the API and the frontend can send JWT tokens
  for those requests.
