import { getRouteApi } from '@tanstack/react-router'

// Accessor for the lesson route's loader data (incl. `lessonBody`) from any component
// rendered under it, without threading props. Takes the route id as a string, so it does
// not import the route module (no circular imports).
export const lessonRouteApi = getRouteApi('/courses/$courseSlug/$moduleSlug/$lessonSlug')
