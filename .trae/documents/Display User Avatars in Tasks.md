I will implement the following changes:

1.  **Update `useTripTasks.ts`**:
    *   Modify the `fetchTasks` function to include expanded user fields for `user_created` and `assigned_to` in the Directus `readItems` call.
    *   I will add `user_created.first_name`, `user_created.last_name`, `user_created.avatar_url`, and the same for `assigned_to`.

2.  **Update `TaskItem.vue`**:
    *   Import the `UserAvatar` component.
    *   Update the template to display:
        *   The **creator's avatar** (small, possibly with a "Created by" tooltip).
        *   The **assigned user's avatar** (replacing the current text/icon representation).
    *   Remove the `<pre>` debug block as requested by the user's intent ("necesito eso mismo en las tareas").

This aligns with the pattern established for Trips, ensuring avatars are consistently displayed.