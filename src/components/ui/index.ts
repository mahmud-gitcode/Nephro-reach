/**
 * The single public entry point for UI primitives.
 *
 * Import from "@/components/ui", never from a file inside it — that keeps
 * the internal file layout free to change.
 */

export { Button, buttonStyles } from "./Button";
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  ButtonAppearance,
  ButtonStyleOptions,
} from "./Button";

export { Modal } from "./Modal";
export type { ModalProps, ModalSize } from "./Modal";

export { Card, CardHeader, CardBody, CardFooter } from "./Card";
export type { CardProps, CardTone, CardPadding } from "./Card";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone, BadgeVariant } from "./Badge";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { FormField } from "./FormField";
export type { FormFieldProps, FieldControlProps } from "./FormField";

export { Input, Textarea, Select } from "./Input";
export type {
  InputProps,
  TextareaProps,
  SelectProps,
  ControlSize,
} from "./Input";

export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableSkeleton,
  TableEmptyRow,
  TablePagination,
} from "./Table";
export type {
  TableHeaderCellProps,
  TableCellProps,
  PaginationProps,
  SortDirection,
} from "./Table";
