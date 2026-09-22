import { ViewContext } from "../service/view-context.ts"

export function OpenDataChip({ ctx }: { ctx: ViewContext }) {
  return (
    <gov-chip color="success" type="outlined" size="xs">
      {ctx.t("open-data")}
    </gov-chip>
  )
}

export function NonPublicChip({ ctx }: { ctx: ViewContext }) {
  return (
    <gov-chip color="secondary" type="outlined" size="xs">
      {ctx.t("non-public-data")}
    </gov-chip>
  )
}

export function HighValueDatasetChip({ ctx }: { ctx: ViewContext }) {
  return (
    <gov-chip color="error" type="outlined" size="xs">
      {ctx.t("high-value-dataset")}
    </gov-chip>
  )
}

export function DynamicDataChip({ ctx }: { ctx: ViewContext }) {
  return (
    <gov-chip color="secondary" type="outlined" size="xs">
      {ctx.t("dynamic-chip")}
    </gov-chip>
  )
}

export function PublicRegistryChip({ ctx }: { ctx: ViewContext }) {
  return (
    <gov-chip color="error" type="outlined" size="xs">
      {ctx.t("public-registry")}
    </gov-chip>
  )
}
