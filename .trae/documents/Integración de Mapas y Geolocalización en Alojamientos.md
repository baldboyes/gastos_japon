# Implement Geolocation for Accommodation

I will implement a reusable geolocation system using the provided Mapbox token and CSV files (`cities.csv`, `prefectures.csv`). This will allow selecting a Prefecture and City (with search) and pinpointing the location on a map.

## 1. Data Logic (`useLocations.ts`)
Create a new composable `app/composables/useLocations.ts` to handle loading and parsing the CSV data.
- **Fetch & Parse**: Load `prefectures.csv` and `cities.csv`.
- **Parsing Logic**: Handle CSV structure including quoted strings (e.g., `"Chūō-ku, Sapporo"`).
- **State**: Expose `prefectures` and `cities` (grouped/filterable by prefecture).

## 2. UI Component (`LocationSelector.vue`)
Create `app/components/ui/LocationSelector.vue` wrapping the selection logic and map.
- **Prefecture Select**: Searchable `Popover` (Combobox style) listing prefectures (EN/JA).
- **City Select**: Searchable `Popover`, filtered by the selected Prefecture.
- **Map Integration**: Reuse `app/components/maps/Editable.vue` to allow setting the precise location (`latitude`/`longitude`).
- **Sync**: Selecting a city/prefecture will attempt to update the map context (if possible), and clicking the map will update coordinates.

## 3. Integration (`accommodation.vue`)
Update the Accommodation page (`app/pages/trips/[id]/accommodation.vue`) to use the new component.
- **Form Data**: Add `prefecture`, `city`, `latitude`, `longitude` to the `formData` state.
- **Component Usage**: Replace/Enhance the "Address" section with `<LocationSelector />`.
- **Persistence**: Ensure these new fields are included when saving the accommodation.

## 4. Updates to Trip Organization
- Update `Vuelo` / `Alojamiento` interfaces in `useTripOrganization.ts` to support the new fields if strictly typed (though current usage seems loose/`any` in some places, I will add types for better DX).

## Verification
- Verify that Prefectures load correctly.
- Verify that selecting a Prefecture filters the City list.
- Verify that the Map works (loads with token, updates coordinates).
- Verify that saving an accommodation persists the location data.