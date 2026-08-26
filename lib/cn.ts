/** Joins conditional class names. Deliberately no tailwind-merge dependency — components in this
 * codebase compose variants explicitly rather than overriding each other's classes, so plain
 * filtering is enough and keeps the dependency list CLAUDE.md §2 fixes from growing. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
