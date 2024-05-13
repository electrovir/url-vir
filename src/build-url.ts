import {
    PartialAndUndefined,
    addPrefix,
    copyThroughJson,
    mapObjectValues,
    typedHasProperty,
} from '@augment-vir/common';
import {hasProperty, isRunTimeType} from 'run-time-assertions';
import {ReadonlyObjectDeep} from 'type-fest/source/readonly-deep';
import {joinUrlParts} from './join-url-parts';
import {
    createFullPath,
    createHost,
    createHref,
    createOrigin,
    createPaths,
    parseUrl,
} from './parse-url';
import {
    SearchParams,
    SearchParamsInput,
    combineSearchParams,
    searchParamsToObject,
    searchParamsToString,
} from './search-params';
import {UrlEncoding, UrlOptions} from './url-options';
import {UrlParts} from './url-parts';

/** Overrides input for `buildUrl`. */
export type UrlOverrides = PartialAndUndefined<{
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
 * @category Primary Exports
 * @returns `UrlParts`, an object similar to the global `URL` class, but with some differences:
 *
 *   - `searchParams` is an object rather than an instance of `URLSearchParams`.
 *   - Search param values are not automatically encoded.
 */
export function buildUrl(
    override: ReadonlyObjectDeep<UrlOverrides>,
    options?: Readonly<UrlOptions> | undefined,
): UrlParts;
/**
 * Build a URL by overriding an existing base URL string.
 *
 * @category Primary Exports
 * @returns `UrlParts`, an object similar to the global `URL` class, but with some differences:
 *
 *   - `searchParams` is an object rather than an instance of `URLSearchParams`.
 *   - Search param values are not automatically encoded.
 */
export function buildUrl(
    baseString: string,
    override: ReadonlyObjectDeep<UrlOverrides>,
    options?: ReadonlyObjectDeep<UrlOptions> | undefined,
): UrlParts;
/**
 * @category Primary Exports
 * @returns `UrlParts`, an object similar to the global `URL` class, but with some differences:
 *
 *   - `searchParams` is an object rather than an instance of `URLSearchParams`.
 *   - Search param values are not automatically encoded.
 */
export function buildUrl(
    baseStringOrOverride: string | ReadonlyObjectDeep<UrlOverrides>,
    overrideOrOptions?:
        | ReadonlyObjectDeep<UrlOverrides>
        | ReadonlyObjectDeep<UrlOptions>
        | undefined,
    maybeOptions?: ReadonlyObjectDeep<UrlOptions> | undefined,
): UrlParts {
    const baseString: string = isRunTimeType(baseStringOrOverride, 'string')
        ? baseStringOrOverride
        : '';
    const override: ReadonlyObjectDeep<UrlOverrides> = isRunTimeType(baseStringOrOverride, 'string')
        ? (overrideOrOptions as Readonly<UrlOverrides>)
        : baseStringOrOverride;
    const options: ReadonlyObjectDeep<UrlOptions> | undefined = isRunTimeType(
        baseStringOrOverride,
        'string',
    )
        ? maybeOptions
        : (overrideOrOptions as Readonly<UrlOptions> | undefined);

    const initUrlParts = parseUrl(baseString);

    const baseUrlParts = mapObjectValues(
        initUrlParts,
        (key, baseValue): string | SearchParamsInput | string[] => {
            if (!typedHasProperty(override, key)) {
                return baseValue;
            }

            const overridePart = override[key];

            if (isRunTimeType(overridePart, 'number')) {
                return String(overridePart);
            } else if (isRunTimeType(overridePart, 'string')) {
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

    if (hasProperty(override, 'paths') && override.paths) {
        baseUrlParts.pathname = joinUrlParts('', ...override.paths);
    }

    const initSearchParams: SearchParams = isRunTimeType(override.search, 'string')
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
