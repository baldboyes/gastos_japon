I will implement the solution in three steps:

1.  **Create Avatar Components (Shadcn UI)**:
    *   I will create the standard Shadcn `Avatar` components in `app/components/ui/avatar` (`Avatar.vue`, `AvatarImage.vue`, `AvatarFallback.vue`, `index.ts`).

2.  **Create Reusable `UserAvatar` Component**:
    *   I'll build `app/components/common/UserAvatar.vue`.
    *   **Logic**: It will accept a `user` prop. It will prioritize `avatar_url` (e.g., Clerk), then fall back to a Directus file URL (using `avatar` ID), and finally display initials if no image is available.
    *   **Usage**: `<UserAvatar :user="userObject" />`

3.  **Update Data Fetching & Trip List**:
    *   Modify `app/composables/useTrips.ts` to fetch expanded fields: `user_created` and `colaboradores.directus_user_id`.
    *   Update `app/pages/trips/index.vue` to replace the raw JSON output with the new `UserAvatar` component for both the creator and collaborators.

This approach ensures the avatar logic is reusable across tasks, flights, and other modules as requested.