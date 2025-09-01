import {check} from '@augment-vir/assert';
import {
    addPrefix,
    copyThroughJson,
    filterObject,
    mapObjectValues,
    type Writable,
} from '@augment-vir/common';
import {
    checkValidShape,
    defineShape,
    optionalShape,
    recordShape,
    unionShape,
} from 'object-shape-tester';
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
    combineSearchParams,
    type SearchParams,
    type SearchParamsInput,
    searchParamsToObject,
    searchParamsToString,
} from './search-params.js';
import {UrlEncoding, type UrlOptions, urlOptionsShape} from './url-options.js';
import {type UrlParts} from './url-parts.js';

/**
 * Shape definition for {@link UrlOverrides}.
 *
 * @category Internal
 */
export const urlOverridesShape = defineShape({
    hash: optionalShape(unionShape(undefined, '')),
    search: optionalShape(
        unionShape(
            undefined,
            '',
            recordShape({
                keys: '',
                values: unionShape(null, undefined, '', -1, false, 0n, [
                    null,
                    undefined,
                    '',
                    -1,
                    false,
                    0n,
                ]),
            }),
        ),
    ),
    hostname: optionalShape(unionShape(undefined, '')),
    pathname: optionalShape(unionShape(undefined, '')),
    paths: optionalShape(unionShape(undefined, [''])),
    protocol: optionalShape(unionShape(undefined, '')),
    username: optionalShape(unionShape(undefined, '')),
    password: optionalShape(unionShape(undefined, '')),
    port: optionalShape(unionShape(undefined, '', -1)),
});

/**
 * Overrides input for {@link buildUrl}.
 *
 * @category Internal
 */
export type UrlOverrides = typeof urlOverridesShape.runtimeType;

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
    override: Readonly<UrlOverrides> | string | URL,
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
    baseUrl: Readonly<UrlParts> | string | URL,
    override: Readonly<UrlOverrides> | string | URL,
    options?: Readonly<UrlOptions> | undefined,
): UrlParts;
/**
 * Builds a URL either from an object of URL parts or from overriding a base URL string.
 *
 * @category Main
 */
export function buildUrl(
    baseUrlOrOverride: Readonly<UrlParts> | Readonly<UrlOverrides> | string | URL,
    overrideOrOptions?: Readonly<UrlOverrides> | Readonly<UrlOptions> | string | URL | undefined,
    maybeOptions?: Readonly<UrlOptions> | undefined,
): UrlParts {
    const hasThirdOptions = !!maybeOptions;
    /**
     * If this is `true`, then that means that the first input `baseUrlOrOverride` is `override` and
     * there is only one required input
     */
    const secondArgIsOptions =
        overrideOrOptions == undefined ||
        checkValidShape(overrideOrOptions, urlOptionsShape, {
            allowExtraKeys: false,
        });

    const baseParts: Readonly<UrlParts> = secondArgIsOptions
        ? parseUrl('')
        : check.instanceOf(baseUrlOrOverride, URL) || check.isString(baseUrlOrOverride)
          ? parseUrl(baseUrlOrOverride)
          : (baseUrlOrOverride as UrlParts);
    const rawOverride = secondArgIsOptions
        ? baseUrlOrOverride
        : (overrideOrOptions as Exclude<typeof overrideOrOptions, UrlOptions>);

    const isRelative = check.isString(rawOverride) && rawOverride.startsWith('.');

    const override: UrlOverrides =
        check.isString(rawOverride) || check.instanceOf(rawOverride, URL)
            ? filterObject(parseUrl(rawOverride), (key, value) => check.isTruthy(value))
            : rawOverride;

    const options: Readonly<UrlOptions> | undefined = hasThirdOptions
        ? maybeOptions
        : secondArgIsOptions
          ? overrideOrOptions
          : undefined;

    const baseUrlParts = mapObjectValues(
        baseParts,
        (key, baseValue): string | Readonly<SearchParamsInput> | ReadonlyArray<string> => {
            if (
                /** Ignore any properties that haven't been overridden. */
                !check.hasKey(override, key)
            ) {
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
    ) as Record<keyof UrlParts, string | SearchParams | string[]> as Writable<UrlParts>;

    if (check.hasKey(override, 'paths') && override.paths) {
        baseUrlParts.pathname = joinUrlPaths(
            isRelative ? baseParts.pathname : '',
            ...override.paths,
        );
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
