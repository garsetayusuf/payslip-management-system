/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Exclude a specific value from an enum object.
 *
 * @param enumObject the enum object to exclude a value from
 * @param selectedKeys the value to exclude from the enum object
 * @returns a new object with all the key-value pairs from the original enum object, except for the excluded value
 */
/**
 * Exclude a specific value from an enum object.
 *
 * @param enumObject the enum object to exclude a value from
 * @param selectedKeys the values to exclude from the enum object
 * @returns a new object with all the key-value pairs from the original enum object, except for the excluded values
 */
export function filterEnum<T extends Record<string, string>>(
  enumObject: T,
  selectedKeys: (keyof T)[],
): Record<keyof T, T[keyof T]> {
  return selectedKeys.reduce(
    (acc, key) => {
      if (key in enumObject) {
        acc[key] = enumObject[key];
      }
      return acc;
    },
    {} as Record<
      (typeof selectedKeys)[number],
      T[(typeof selectedKeys)[number]]
    >,
  );
}
