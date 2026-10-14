/** "1 zone", "3 zones"; `many` for a plural that isn't `one` + "s". */
export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
