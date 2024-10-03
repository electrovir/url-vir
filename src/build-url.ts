import {check} from '@augment-vir/assert';
import {
    addPrefix,
    copyThroughJson,
    mapObjectValues,
    type PartialWithUndefined,
} from '@augment-vir/common';
import {ReadonlyObjectDeep} from 'type-fest/source/readonly-deep';
import {joinUrlPaths} from './join-url-paths.js';
import {
    createFullPath,
    createHost,
    createHref,
    createOrigin,
    createPaths,
    parseUrl,
} from './parse-url.js';
import {
    SearchParams,
    SearchParamsInput,
    combineSearchParams,
    searchParamsToObject,
    searchParamsToString,
} from './search-params.js';
import {UrlEncoding, UrlOptions} from './url-options.js';
import {UrlParts} from './url-parts.js';

/**
 * Overrides input for {@link buildUrl}.
 *
 * @category Internal
 */
export type UrlOverrides = PartialWithUndefined<{
    hash?: string;
    search?: string | SearchParamsInput;
    hostname?: string;
    pathname?: string;
    paths?: string[];
    protocol?: string;
    username?: string;
    password?: string;
    port?: string | number;
}>;

/**
 * Build a URL straight from overrides.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {buildUrl} from 'url-vir';
 *
 * buildUrl({
 *     hostname: 'example.com',
 *     search: {
 *         hello: 'there',
 *     },
 * });
 *
 * buildUrl.href; // `'example.com/?hello=there'`
 * ```
 */
export function buildUrl(
    override: ReadonlyObjectDeep<UrlOverrides>,
    options?: Readonly<UrlOptions> | undefined,
): UrlParts;
/**
 * Build a URL by overriding an existing base URL string.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {buildUrl} from 'url-vir';
 *
 * buildUrl('github.com/?hello=there', {
 *     hostname: 'example.com',
 * });
 *
 * buildUrl.href; // `'example.com/?hello=there'`
 * ```
 */
export function buildUrl(
    baseUrl: string | URL,
    override: ReadonlyObjectDeep<UrlOverrides>,
    options?: ReadonlyObjectDeep<UrlOptions> | undefined,
): UrlParts;
/**
 * Builds a URL either from an object of URL parts or from overriding a base URL string.
 *
 * @category Main
 */
export function buildUrl(
    baseUrlOrOverride: string | URL | ReadonlyObjectDeep<UrlOverrides>,
    overrideOrOptions?:
        | ReadonlyObjectDeep<UrlOverrides>
        | ReadonlyObjectDeep<UrlOptions>
        | undefined,
    maybeOptions?: ReadonlyObjectDeep<UrlOptions> | undefined,
): UrlParts {
    const baseUrl: string = check.isString(baseUrlOrOverride)
        ? baseUrlOrOverride
        : baseUrlOrOverride instanceof URL
          ? baseUrlOrOverride.toString()
          : '';
    const override: ReadonlyObjectDeep<UrlOverrides> =
        check.isString(baseUrlOrOverride) || baseUrlOrOverride instanceof URL
            ? (overrideOrOptions as Readonly<UrlOverrides>)
            : baseUrlOrOverride;
    const options: ReadonlyObjectDeep<UrlOptions> | undefined =
        check.isString(baseUrlOrOverride) || baseUrlOrOverride instanceof URL
            ? maybeOptions
            : (overrideOrOptions as Readonly<UrlOptions> | undefined);

    const initUrlParts = parseUrl(baseUrl);

    const baseUrlParts = mapObjectValues(
        initUrlParts,
        (key, baseValue): string | SearchParamsInput | string[] => {
            if (!check.hasKey(override, key)) {
                return baseValue;
            }

            const overridePart = override[key];

            if (check.isNumber(overridePart)) {
                return String(overridePart);
            } else if (check.isString(overridePart)) {
                if (key === 'hash' && overridePart) {
                    return addPrefix({value: overridePart, prefix: '#'});
                } else if (key === 'pathname') {
                    return addPrefix({value: overridePart, prefix: '/'});
                } else {
                    return overridePart;
                }
            } else {
                return baseValue;
            }
        },
    ) as Record<keyof UrlParts, string | SearchParams | string[]> as UrlParts;

    if (check.hasKey(override, 'paths') && override.paths) {
        baseUrlParts.pathname = joinUrlPaths('', ...override.paths);
    }

    const initSearchParams: SearchParams = check.isString(override.search)
        ? searchParamsToObject(addPrefix({value: override.search, prefix: '?'}))
        : copyThroughJson((override.search || {}) as SearchParams);

    const searchParams = combineSearchParams(baseUrlParts.searchParams, initSearchParams, {
        ...options,
        encoding: UrlEncoding.None,
    });

    const search = searchParamsToString(searchParams, options);

    const joinedParts: UrlParts = {
        ...baseUrlParts,
        searchParams,
        search,
        paths: createPaths(baseUrlParts),
        fullPath: createFullPath(baseUrlParts),
        host: createHost(baseUrlParts),
        origin: createOrigin(baseUrlParts),
        href: createHref({
            ...baseUrlParts,
            search,
        }),
    };

    return joinedParts;
}
