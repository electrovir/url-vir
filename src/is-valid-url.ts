import {check} from '@augment-vir/assert';
import {wrapInTry} from '@augment-vir/common';
import {UrlParts} from './url-parts.js';

/**
 * Checks if the given URL can be parsed by the `URL` class. Note that this is pretty strict: many
 * values which can be correctly handled by `parseUrl` will fail this. (For example, the protocol
 * must be included for this to pass.)
 *
 * @category Util
 */
export function isValidUrl(input: string | URL | Readonly<Pick<UrlParts, 'href'>>): boolean {
    return !!toValidUrl(input);
}

/**
 * Attempt to convert the input input a valid URL string via the `URL` class. If the conversion
 * fails, `undefined` is returned. Note that this is pretty strict: many values which can be
 * correctly handled by `parseUrl` will fail this. (For example, the protocol must be included for
 * this to pass.)
 *
 * @category Util
 * @returns Url string if input can be parsed. Otherwise, `undefined`.
 */
export function toValidUrl(
    input: string | URL | Readonly<Pick<UrlParts, 'href'>>,
): string | undefined {
    if (input instanceof URL) {
        return input.href;
    }

    const urlString = check.isString(input) ? input : input.href;

    return wrapInTry(
        () => {
            return new URL(urlString).href;
        },
        {
            fallbackValue: undefined,
        },
    );
}
