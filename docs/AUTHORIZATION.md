# Authorization And Access Rules

This document captures the intended platform rules before the full
authentication system is implemented.

## User Roles

The domain already has these roles:

- `Participant` - registers for events and can view their own registrations later.
- `Organizer` - creates events, manages registrations, and performs check-in.
- `Admin` - manages the whole platform, including users, categories, and moderation.

## Event Ownership

Each event belongs to one organizer through `Event.OrganizerId`.

Planned access rules:

- any authenticated user may create an event and become its organizer;
- only the event organizer or an admin may update, publish, cancel, or complete it;
- only the event organizer or an admin may view the full registrations list;
- participants may only see their own registration data after user accounts are added.

## Event Modes

Current event lifecycle:

```text
Draft -> Published -> Ongoing -> Completed
Draft/Published/Ongoing -> Cancelled
```

Planned event settings:

```text
RegistrationEnabled: true/false
CheckInEnabled: true/false
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

1. Email/password registration and login.
2. Password hashing.
3. JWT access tokens.
4. API authorization policies by role and event ownership.
5. Frontend login screen and authenticated API client.
6. External OAuth login later, for example Yandex ID.

External OAuth should not be the first auth step because it adds provider
configuration, callback URLs, client secrets, and deployment-specific setup.

## API Policy Direction

Planned restrictions:

- `POST /api/events` requires an authenticated user.
- event mutation endpoints require organizer ownership or admin role.
- `GET /api/events/{eventId}/registrations` requires organizer ownership or admin role.
- `POST /api/check-in` requires organizer ownership or admin role.
- public event list/details may remain anonymous while the platform is in MVP mode.

Temporary MVP exception:

- current endpoints are open while the frontend and base workflows are being built.
