import {AnyObject, PropertyValueType, getObjectTypedKeys} from '@augment-vir/common';
import {isRunTimeType} from 'run-time-assertions';
import {ReadonlyDeep} from 'type-fest';
import {joinUrlParts} from './join-url-parts';

/**
 * This must be exported so that TypeScript doesn't run into "is using private name" errors.
 *
 * @deprecated: this should not be used directly, use the `param` export instead.
 */
export const paramSymbol = Symbol('url param');

/** Create a URL path part which is a variable parameter. */
export function param<Description extends string>(
    /** The parameter name. */
    name: '' extends Description ? 'TypeError: cannot use empty string' : Description,
): typeof paramSymbol {
    return paramSymbol;
}

/** An object of nested paths used as the input for `defineEndpoints`. */
export type NestedPaths = Readonly<{
    [Key in string | typeof paramSymbol]?: NestedPaths | undefined;
}>;

/** An object of nested endpoint definitions used as the output for `defineEndpoints`. */
export type EndpointDefinition<Paths extends NestedPaths> = Readonly<{
    [Path in keyof Paths as Path extends typeof paramSymbol
        ? never
        : Path]: Paths[Path] extends NestedPaths ? EndpointDefinition<Paths[Path]> : never;
}> &
    (Paths[typeof paramSymbol] extends NestedPaths
        ? {
              (param: string): EndpointDefinition<Paths[typeof paramSymbol]>;
          }
        : {});

type AllNestedKeys<Input extends ReadonlyDeep<AnyObject>> =
    | keyof Input
    | keyof Extract<PropertyValueType<Input>, AnyObject>;

/**
 * Create type-safe url definitions that don't obfuscate the actual url path. So you can reduce code
 * reuse but still be able to read your API URL calls.
 *
 * @category Primary Exports
 * @example
 *     // definition
 *     const myEndpoints = defineEndpoints({
 *         'https://my-api.example.com': {
 *             v1: {
 *                 'get-value': {},
 *                 'set-value': {
 *                     // sets a variable path part
 *                     [param('Value')]: {},
 *                 },
 *             },
 *         },
 *     });
 *     // usage
 *     fetch(myEndpoints['https://my-api.example.com'].v1['get-value'].toString());
 *     fetch(String(myEndpoints['https://my-api.example.com'].v1['set-value']('my-value')));
 *
 * @readonly true
 */
export function defineEndpoints<const Paths extends ReadonlyDeep<NestedPaths>>(
    nestedPaths: Exclude<AllNestedKeys<Paths>, string | typeof paramSymbol> extends never
        ? ReadonlyDeep<Paths>
        : never,
    parentPath?: string,
): EndpointDefinition<Paths> {
    const containsParams = getObjectTypedKeys(nestedPaths).some((pathKey) => {
        return pathKey === paramSymbol;
    });

    const endpointDefinition = containsParams
        ? (param: string) => {
              return defineEndpoints(
                  nestedPaths[paramSymbol]!,
                  parentPath ? joinUrlParts(parentPath, param) : param,
              );
          }
        : {};

    const pathKeyDefinitions = getObjectTypedKeys(nestedPaths).reduce((accum, pathKey) => {
        const innerNestedPaths: NestedPaths | undefined = nestedPaths[pathKey];

        if (isRunTimeType(pathKey, 'string') && innerNestedPaths) {
            const currentPath = parentPath ? joinUrlParts(parentPath, pathKey) : pathKey;

            accum[pathKey] = {
                value: defineEndpoints(innerNestedPaths, currentPath),
                writable: false,
                enumerable: true,
            };
        } else if (isRunTimeType(pathKey, 'symbol') && pathKey !== paramSymbol) {
            throw new Error(`Unexpected path key: '${String(pathKey)}'`);
        }

        return accum;
    }, {} as PropertyDescriptorMap);

    Object.defineProperties(endpointDefinition, {
        ...pathKeyDefinitions,
        toString: {
            value: () => parentPath,
        },
    });

    return endpointDefinition as EndpointDefinition<Paths>;
}
