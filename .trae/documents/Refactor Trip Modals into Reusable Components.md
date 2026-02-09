Based on the user's request, the plan is to refactor the modal dialogs (used for creating/editing flights, accommodations, transport, activities, and insurance) into standalone, reusable components. This will clean up the page files and make the forms reusable elsewhere in the application.

**Plan:**

1. **Create Reusable Form Components:**
   I will create a new directory `app/components/trips/modals` and move the form logic and UI from each page into a dedicated component.

   * `FlightModal.vue`: Extracted from `pages/trips/[id]/flights.vue`

   * `AccommodationModal.vue`: Extracted from `pages/trips/[id]/accommodation.vue`

   * `TransportModal.vue`: Extracted from `pages/trips/[id]/transport.vue`

   * `ActivityModal.vue`: Extracted from `pages/trips/[id]/activities.vue`

   * `InsuranceModal.vue`: Extracted from `pages/trips/[id]/insurance.vue`

2. **Define Component Interface:**
   Each modal component will accept the following props to ensure it works seamlessly with the existing `useTripItemForm` composable logic or standalone:

   * `modelValue` (boolean): Controls visibility (v-model).

   * `item` (object): The data to edit (or empty for create).

   * `tripId` (string/number): Required for saving.

   * `currentTrip` (object): For date validation limits.

   * **Events**:

     * `update:modelValue`: For closing the modal.

     * `saved`: Emitted when a record is successfully saved/created.

3. **Refactor Page Files:**
   I will update the original page files to import and use these new components instead of having the inline `Dialog` code. This will significantly reduce the line count of the page files.

4. **Clean Up:**

   * Remove unused imports from the page files (e.g., `Dialog`, `Input`, `Label`, `Select`... if they are only used in the modal).

   * Ensure no "orphan calls" remain (variables that were only used by the form).

5. **Verify Functionality:**
   Ensure that opening, editing, and saving items still works correctly after the refactor.

**Note:** The logic for `useTripItemForm` might need to be slightly adjusted or simply passed down. Since `useTripItemForm` manages the `formData` state, it might be cleaner to keep the *state management* in the parent (page) or move it entirely into the modal.
*Decision*: I will move the specific form state and validation logic *into* the new Modal component. The Parent will only handle "Open Modal" and "Refresh Data on Save". This makes the component truly self-contained and reusable.

**Files to be created:**

* `app/components/trips/modals/FlightModal.vue`

* `app/components/trips/modals/AccommodationModal.vue`

* `app/components/trips/modals/TransportModal.vue`

* `app/components/trips/modals/ActivityModal.vue`

* `app/components/trips/modals/InsuranceModal.vue`

**Files to be modified:**

* `app/pages/trips/[id]/flights.vue`

* `app/pages/trips/[id]/accommodation.vue`

* `app/pages/trips/[id]/transport.vue`

* `app/pages/trips/[id]/activities.vue`

* `app/pages/trips/[id]/insurance.vue`

