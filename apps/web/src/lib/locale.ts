// The app's locale defaults. App-owned: Setup copies this file as it is, and
// from then on it is the app's to change, like any other code. It is not a
// kit file, so it carries no kit version, and it isn't part of the design
// system.
import { enCA } from "date-fns/locale";
import type { Locale } from "date-fns";

/**
 * Locale defaults for date components: Calendar and DatePicker default to
 * these and take a prop to override one instance. A runtime locale (a user
 * preference, a second language) is passed to the components as props; these
 * stay the defaults.
 */

/** The locale tag, for `Intl` and `lang` attributes. A canonical BCP 47 tag. */
export const localeTag = "en-CA";

/** The date-fns locale for `localeTag`. Import only the one you use. */
export const locale: Locale = enCA;

/** Which day a week starts on, 0 = Sunday. Stated here, never derived from the locale. */
export const weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0;

/**
 * The typed-entry date pattern as a person reads it ("DD/MM/YYYY"), or "" for
 * the locale's own pattern. Numeric only: it is what DatePicker parses.
 */
export const dateFormat: string = "";
