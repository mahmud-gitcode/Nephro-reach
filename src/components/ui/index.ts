/**
 * The single public entry point for UI primitives.
 *
 * Import from "@/components/ui", never from a file inside it — that keeps
 * the internal file layout free to change.
 */

export { Button } from "./Button";
export { buttonStyles } from "./buttonStyles";
export type { ButtonProps } from "./Button";
export type {
  ButtonSize,
  ButtonVariant,
  ButtonAppearance,
  ButtonStyleOptions,
} from "./buttonStyles";

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

export { Alert } from "./Alert";
export type { AlertProps, AlertTone } from "./Alert";

export { Tabs, TabPanel } from "./Tabs";
export type { TabsProps, TabsVariant, TabItem, TabPanelProps } from "./Tabs";

export { Chip, ChipGroup } from "./Chip";
export type { ChipProps, ChipGroupProps } from "./Chip";

export { Switch, SwitchRow } from "./Switch";
export type { SwitchProps, SwitchRowProps, SwitchSize } from "./Switch";

export { RadioGroup, RadioCard } from "./RadioGroup";
export type { RadioGroupProps, RadioCardProps } from "./RadioGroup";

export { LineChart, Sparkline, CATEGORICAL_TONES, toneVar } from "./Chart";
export type {
  LineChartProps,
  SparklineProps,
  ChartSeries,
  SeriesTone,
} from "./Chart";

export { BarChart, ChartLegend } from "./BarChart";
export type { BarChartProps, Bar, ChartLegendItem } from "./BarChart";

export { DonutChart } from "./DonutChart";
export type { DonutChartProps, DonutSegment } from "./DonutChart";

export { Progress } from "./Progress";
export type { ProgressProps, ProgressTone, ProgressSize } from "./Progress";

export { Skeleton, SkeletonText } from "./Skeleton";
export type { SkeletonProps } from "./Skeleton";

export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

export { AsyncSection } from "./AsyncSection";
export type { AsyncSectionProps } from "./AsyncSection";

export { MonthCalendar } from "./MonthCalendar";
export type { MonthCalendarProps } from "./MonthCalendar";
