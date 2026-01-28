"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import {
  GripVertical,
  Building2,
  Globe,
  ExternalLink,
  ChevronRight,
  Type,
  FileText,
  Briefcase,
  Users,
  DollarSign,
  MapPin,
  Cpu,
  Hash,
  Calendar,
  Factory,
  Check,
  X,
  CircleDot,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Business } from "@/lib/explorium/types";
import { cn } from "@/lib/utils";

// Helper to get business ID from either field
const getBusinessId = (business: Business): string => {
  return business.business_id || business.id || business.name;
};

// Helper to get company logo URL (supports both 'logo' and 'logo_url' fields)
const getCompanyLogo = (company: Business): string | undefined => {
  return company.logo || company.logo_url;
};

// Words that should not be capitalized (unless first word)
const LOWERCASE_WORDS = new Set([
  // English
  "and", "or", "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "by",
  // Portuguese
  "e", "ou", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas", "para", "com", "por",
  // Spanish
  "y", "o", "el", "la", "los", "las", "en", "con",
]);

// Smart capitalize function
const smartCapitalize = (text: string | undefined | null): string => {
  if (!text) return "-";

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Don't capitalize lowercase words
      if (LOWERCASE_WORDS.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

type ColumnId =
  | "select"
  | "name"
  | "description"
  | "industry"
  | "employees"
  | "revenue"
  | "location"
  | "domain"
  | "linkedin"
  | "tech_analytic"
  | "tech_collaboration"
  | "tech_communication"
  | "tech_computer_network"
  | "tech_customer_management"
  | "tech_devops"
  | "tech_ecommerce"
  | "tech_finance"
  | "tech_health"
  | "tech_management"
  | "tech_marketing"
  | "tech_operation_management"
  | "tech_operation_software"
  | "tech_people"
  | "tech_platform_storage"
  | "tech_product_design"
  | "tech_productivity"
  | "tech_programming"
  | "tech_sale"
  | "tech_security"
  | "tech_test"
  | "brazil_cnpj"
  | "brazil_share_capital"
  | "brazil_primary_cnae"
  | "brazil_secondary_cnae"
  | "brazil_establishment_identifier"
  | "brazil_activity_start_date"
  | "brazil_legal_nature"
  | "brazil_economic_sector"
  | "brazil_mei"
  | "brazil_simples"
  | "brazil_registration_status"
  | "brazil_registration_status_date"
  | "brazil_partners";

export type CompanyColumnId = ColumnId;

export const TECHNOGRAPHICS_COLUMNS: { id: ColumnId; label: string; field: keyof Business }[] = [
  { id: "tech_analytic", label: "Company Technology Analytic", field: "company_technology_analytic" },
  { id: "tech_collaboration", label: "Company Technology Collaboration", field: "company_technology_collaboration" },
  { id: "tech_communication", label: "Company Technology Communication", field: "company_technology_communication" },
  { id: "tech_computer_network", label: "Company Technology Computer Network", field: "company_technology_computer_network" },
  { id: "tech_customer_management", label: "Company Technology Customer Management", field: "company_technology_customer_management" },
  { id: "tech_devops", label: "Company Technology DevOps", field: "company_technology_devops_and_development" },
  { id: "tech_ecommerce", label: "Company Technology E-commerce", field: "company_technology_ecommerce" },
  { id: "tech_finance", label: "Company Technology Finance", field: "company_technology_finance_and_accounting" },
  { id: "tech_health", label: "Company Technology Health", field: "company_technology_health" },
  { id: "tech_management", label: "Company Technology Management", field: "company_technology_management" },
  { id: "tech_marketing", label: "Company Technology Marketing", field: "company_technology_marketing" },
  { id: "tech_operation_management", label: "Company Technology Operation Management", field: "company_technology_operation_management" },
  { id: "tech_operation_software", label: "Company Technology Operation Software", field: "company_technology_operation_software" },
  { id: "tech_people", label: "Company Technology People", field: "company_technology_people" },
  { id: "tech_platform_storage", label: "Company Technology Platform and Storage", field: "company_technology_platform_and_storage" },
  { id: "tech_product_design", label: "Company Technology Product and Design", field: "company_technology_product_and_design" },
  { id: "tech_productivity", label: "Company Technology Productivity", field: "company_technology_productivity_and_operation" },
  { id: "tech_programming", label: "Company Technology Programming", field: "company_technology_programming_language_and_framework" },
  { id: "tech_sale", label: "Company Technology Sale", field: "company_technology_sale" },
  { id: "tech_security", label: "Company Technology Security", field: "company_technology_security" },
  { id: "tech_test", label: "Company Technology Test", field: "company_technology_test" },
];

export const BRAZIL_COLUMNS: { id: ColumnId; label: string; field: string; width: number; minWidth: number }[] = [
  { id: "brazil_cnpj", label: "Company Brazil CNPJ", field: "cnpj", width: 180, minWidth: 180 },
  { id: "brazil_share_capital", label: "Company Brazil Share Capital", field: "capital_social", width: 200, minWidth: 200 },
  { id: "brazil_primary_cnae", label: "Company Brazil CNAE Primary", field: "cnae_principal", width: 200, minWidth: 200 },
  { id: "brazil_secondary_cnae", label: "Company Brazil CNAE Secondary", field: "cnae_secundarios", width: 220, minWidth: 220 },
  { id: "brazil_establishment_identifier", label: "Company Brazil Establishment Identifier", field: "establishment_identifier", width: 280, minWidth: 280 },
  { id: "brazil_activity_start_date", label: "Company Brazil Activity Start Date", field: "activity_start_date", width: 240, minWidth: 240 },
  { id: "brazil_legal_nature", label: "Company Brazil Legal Nature", field: "legal_nature", width: 200, minWidth: 200 },
  { id: "brazil_economic_sector", label: "Company Brazil Economic Sector", field: "economic_sector", width: 220, minWidth: 220 },
  { id: "brazil_mei", label: "Company Brazil MEI", field: "simples.mei_option", width: 160, minWidth: 160 },
  { id: "brazil_simples", label: "Company Brazil Simples", field: "simples.simples_option", width: 180, minWidth: 180 },
  { id: "brazil_registration_status", label: "Company Brazil Registration Status", field: "registration_status", width: 240, minWidth: 240 },
  { id: "brazil_registration_status_date", label: "Company Brazil Registration Status Date", field: "registration_status_date", width: 280, minWidth: 280 },
  { id: "brazil_partners", label: "Company Brazil Partners", field: "partners", width: 200, minWidth: 200 },
];

// Format location based on available data
const formatLocation = (company: Business): string => {
  const city = company.city_name || company.address?.city;
  const region = company.state_region_name || company.address?.state;
  const country = company.country_name || company.address?.country;

  if (city && region && country) {
    // Cidade, Regiao - Pais
    return `${smartCapitalize(city)}, ${smartCapitalize(region)} - ${smartCapitalize(country)}`;
  }

  if (region && country) {
    // Regiao - Pais
    return `${smartCapitalize(region)} - ${smartCapitalize(country)}`;
  }

  if (city && country) {
    // Cidade - Pais
    return `${smartCapitalize(city)} - ${smartCapitalize(country)}`;
  }

  if (city && region) {
    // Cidade, Regiao
    return `${smartCapitalize(city)}, ${smartCapitalize(region)}`;
  }

  // Only one value exists
  if (city) return smartCapitalize(city);
  if (region) return smartCapitalize(region);
  if (country) return smartCapitalize(country);

  return "-";
};

interface Column {
  id: ColumnId;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sticky?: boolean;
  stickyOffset?: number;
}

interface CompanyTableProps {
  companies: Business[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  hiddenColumns?: ColumnId[];
  onCompanyClick?: (company: Business) => void;
  startIndex?: number;
}

function SortableHeader({
  column,
  children,
  onAutoResize,
  isResizing,
  onResizeStart,
}: {
  column: Column;
  children: React.ReactNode;
  onAutoResize?: (columnId: ColumnId) => void;
  isResizing?: boolean;
  onResizeStart?: (columnId: ColumnId, startX: number, startWidth: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onResizeStart?.(column.id, e.clientX, column.width || 100);
    },
    [column.id, column.width, onResizeStart]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAutoResize?.(column.id);
    },
    [column.id, onAutoResize]
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? "none" : transition,
    opacity: isDragging ? 0.5 : 1,
    width: column.width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
    position: "sticky" as const,
    top: 0,
    zIndex: column.sticky ? 30 : 20,
    ...(column.sticky && {
      left: column.stickyOffset ?? 0,
    }),
  };

  const isNonDraggable = column.id === "select" || column.id === "name";
  const canResize = column.id !== "select";
  const showSeparator = true;

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-card border-b",
        column.id === "select" && "px-0",
        isDragging && "bg-muted z-50",
        showSeparator && "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border"
      )}
    >
      <div className={cn(
        "flex items-center gap-1",
        column.id !== "select" && "pr-2"
      )}>
        {!isNonDraggable && (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-foreground text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3" />
          </span>
        )}
        {children}
      </div>
      {/* Resize handle */}
      {canResize && (
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "absolute right-0 top-0 h-full w-2 cursor-col-resize z-30",
            "hover:bg-primary/20",
            isResizing && "bg-primary/30"
          )}
        />
      )}
    </TableHead>
  );
}

export function CompanyTable({
  companies,
  selectedIds,
  onSelectChange,
  hiddenColumns = [],
  onCompanyClick,
  startIndex = 0,
}: CompanyTableProps) {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Resize state - managed at parent level for better performance
  const [resizingColumnId, setResizingColumnId] = useState<ColumnId | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const defaultColumns: Column[] = useMemo(
    () => [
      { id: "select", label: "", width: 40, minWidth: 40, maxWidth: 40, sticky: true, stickyOffset: 0 },
      { id: "name", label: "Company Name", width: 200, minWidth: 140, maxWidth: 400, sticky: true, stickyOffset: 40 },
      { id: "description", label: "Company Description", width: 200, minWidth: 180, maxWidth: 400 },
      { id: "industry", label: "Company Industry", width: 160, minWidth: 160, maxWidth: 250 },
      { id: "employees", label: "Company Employees", width: 170, minWidth: 170, maxWidth: 200 },
      { id: "revenue", label: "Company Revenue", width: 160, minWidth: 160, maxWidth: 200 },
      { id: "location", label: "Company Location", width: 200, minWidth: 160, maxWidth: 350 },
      { id: "domain", label: "Company Domain", width: 160, minWidth: 160, maxWidth: 250 },
      { id: "linkedin", label: "Company LinkedIn", width: 160, minWidth: 160, maxWidth: 250 },
      ...TECHNOGRAPHICS_COLUMNS.map((col) => ({
        id: col.id,
        label: col.label,
        width: Math.max(200, col.label.length * 7),
        minWidth: col.label.length * 7,
        maxWidth: 400,
      })),
      ...BRAZIL_COLUMNS.map((col) => ({
        id: col.id,
        label: col.label,
        width: col.width,
        minWidth: col.minWidth,
        maxWidth: col.width * 2,
      })),
    ],
    []
  );

  const [columns, setColumns] = useState<Column[]>(defaultColumns);

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.id === "select" || !hiddenColumns.includes(col.id)),
    [columns, hiddenColumns]
  );

  useEffect(() => {
    setColumns((prev) =>
      prev.map((col) => {
        const defaultCol = defaultColumns.find((d) => d.id === col.id);
        return defaultCol ? { ...col, label: defaultCol.label } : col;
      })
    );
  }, [defaultColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        // Don't allow moving select, name, or actions columns (fixed columns)
        const activeItem = items[oldIndex];
        const overItem = items[newIndex];
        const fixedColumns = ["select", "name", "actions"];
        if (
          fixedColumns.includes(activeItem.id) ||
          fixedColumns.includes(overItem.id)
        ) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleColumnResize = useCallback((columnId: ColumnId, width: number) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, width } : col))
    );
  }, []);

  // Handle resize start - called from header component
  const handleResizeStart = useCallback(
    (columnId: ColumnId, startX: number, startWidth: number) => {
      setResizingColumnId(columnId);
      resizeStartXRef.current = startX;
      resizeStartWidthRef.current = startWidth;
    },
    []
  );

  // Global mouse move/up handlers for resize
  useEffect(() => {
    if (!resizingColumnId) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const column = columns.find((c) => c.id === resizingColumnId);
      if (!column) return;

      const diff = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(
        column.minWidth || 50,
        Math.min(column.maxWidth || 500, resizeStartWidthRef.current + diff)
      );
      handleColumnResize(resizingColumnId, newWidth);
    };

    const handleMouseUp = () => {
      setResizingColumnId(null);
    };

    // Add listeners to document for reliable tracking
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Change cursor globally while resizing
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumnId, columns, handleColumnResize]);

  // Auto-resize column to fit content on double-click
  const handleAutoResize = useCallback(
    (columnId: ColumnId) => {
      // Create a temporary span to measure text width
      const measureText = (text: string, fontWeight: string = "normal"): number => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return 0;
        context.font = `${fontWeight} 14px ui-sans-serif, system-ui, sans-serif`;
        return context.measureText(text).width;
      };

      let maxWidth = 0;
      const padding = 32; // Account for cell padding

      // Measure header text
      const column = columns.find((c) => c.id === columnId);
      if (column?.label) {
        maxWidth = Math.max(maxWidth, measureText(column.label, "500") + padding + 24); // Extra for grip icon
      }

      // Measure content in each row
      companies.forEach((company) => {
        let text = "";
        switch (columnId) {
          case "name":
            text = company.name || "";
            maxWidth = Math.max(maxWidth, measureText(text, "500") + padding + 44); // Extra for avatar
            break;
          case "description":
            text = company.business_description || company.description || "";
            break;
          case "industry":
            text = company.industry || "";
            break;
          case "employees":
            text = company.number_of_employees_range || company.employee_range || "";
            break;
          case "revenue":
            text = company.yearly_revenue_range || company.revenue_range || "";
            break;
          case "location":
            text = formatLocation(company);
            break;
          case "domain":
            text = company.domain || "";
            break;
          case "linkedin":
            text = (company.linkedin_company_url || company.linkedin_url || "")
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "");
            break;
          default:
            break;
        }
        if (text && columnId !== "name") {
          maxWidth = Math.max(maxWidth, measureText(text) + padding);
        }
      });

      // Apply constraints
      const finalWidth = Math.max(
        column?.minWidth || 50,
        Math.min(column?.maxWidth || 500, maxWidth)
      );

      setColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, width: finalWidth } : col))
      );
    },
    [companies, columns]
  );

  const allSelected =
    companies.length > 0 &&
    companies.every((c) => selectedIds.includes(getBusinessId(c)));

  const someSelected =
    selectedIds.length > 0 &&
    !allSelected &&
    companies.some((c) => selectedIds.includes(getBusinessId(c)));

  const handleSelectAll = () => {
    const currentPageIds = companies.map((c) => getBusinessId(c));
    if (allSelected) {
      // Remove only current page IDs, keep others
      onSelectChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
    } else {
      // Add current page IDs without removing others
      const newIds = currentPageIds.filter((id) => !selectedIds.includes(id));
      onSelectChange([...selectedIds, ...newIds]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const renderCellContent = (columnId: ColumnId, company: Business, rowIndex: number) => {
    switch (columnId) {
      case "select": {
        const businessId = getBusinessId(company);
        const isSelected = selectedIds.includes(businessId);
        const isHovered = hoveredRowId === businessId;
        const rowNumber = startIndex + rowIndex + 1;
        const showCheckbox = isSelected || isHovered;

        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-full min-h-4"
          >
            {showCheckbox ? (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleSelectOne(businessId)}
                className="cursor-pointer"
              />
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums text-center leading-4">
                {rowNumber}
              </span>
            )}
          </div>
        );
      }
      case "name":
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5 rounded flex-shrink-0">
              {getCompanyLogo(company) ? (
                <AvatarImage
                  src={getCompanyLogo(company)}
                  alt={company.name}
                  className="object-contain"
                />
              ) : null}
              <AvatarFallback className="rounded bg-muted">
                <Building2 className="h-3 w-3 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm truncate">{company.name}</span>
          </div>
        );
      case "description": {
        const description = company.business_description || company.description || "-";
        return (
          <span className="text-sm truncate block" title={description}>
            {description}
          </span>
        );
      }
      case "industry": {
        const industry = smartCapitalize(company.industry);
        return industry && industry !== "-" ? (
          <span className="text-sm truncate">{industry}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      }
      case "employees": {
        const employeeValue = company.number_of_employees_range ||
          company.employee_count?.toLocaleString("pt-BR") ||
          company.employee_range;
        return employeeValue ? (
          <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm">
            {employeeValue} employees
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      }
      case "revenue": {
        const revenueValue = company.yearly_revenue_range ||
          company.revenue_range ||
          (company.revenue ? `$${company.revenue.toLocaleString("en-US")}` : null);
        return revenueValue ? (
          <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm">
            {revenueValue}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      }
      case "location": {
        const location = formatLocation(company);
        return location && location !== "-" ? (
          <span className="text-sm truncate" title={location}>
            {location}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      }
      case "domain":
        return company.domain ? (
          <a
            href={`https://${company.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{company.domain}</span>
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      case "linkedin": {
        const linkedinUrl = company.linkedin_company_url || company.linkedin_url;
        const displayUrl = linkedinUrl
          ?.replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        return linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm hover:underline cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{displayUrl}</span>
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      }
      default: {
        const techColumn = TECHNOGRAPHICS_COLUMNS.find((col) => col.id === columnId);
        if (techColumn) {
          const techValues = company[techColumn.field] as string[] | undefined;
          if (techValues && techValues.length > 0) {
            return (
              <div className="flex gap-1 overflow-hidden">
                {techValues.slice(0, 2).map((tech, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm shrink-0">
                    {tech}
                  </Badge>
                ))}
                {techValues.length > 2 && (
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap rounded-sm shrink-0">
                    +{techValues.length - 2}
                  </Badge>
                )}
              </div>
            );
          }
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        const brazilColumn = BRAZIL_COLUMNS.find((col) => col.id === columnId);
        if (brazilColumn && company.brazil_enrichment) {
          const enrichment = company.brazil_enrichment.enrichment as Record<string, unknown> || {};

          switch (brazilColumn.field) {
            case "cnpj": {
              let value = enrichment.cnpj as string | null;
              if (value) {
                const digits = String(value).replace(/\D/g, "");
                if (digits.length === 14) {
                  value = digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
                }
                return <span className="text-sm truncate" title={value}>{value}</span>;
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "capital_social": {
              const capitalSocial = enrichment.capital_social ?? enrichment.share_capital;
              if (capitalSocial !== null && capitalSocial !== undefined) {
                const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(capitalSocial));
                return <span className="text-sm truncate" title={formatted}>{formatted}</span>;
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "cnae_principal": {
              const cnaeRaw = enrichment.cnae_principal ?? enrichment.cnae_primary ?? enrichment.primary_cnae;
              if (!cnaeRaw) {
                return <span className="text-sm text-muted-foreground">-</span>;
              }
              if (typeof cnaeRaw === "string") {
                const parts = cnaeRaw.split(" - ");
                const code = parts[0]?.trim();
                const description = parts.length > 1 ? parts.slice(1).join(" - ").trim() : undefined;
                if (code) {
                  return (
                    <Popover>
                      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm cursor-pointer hover:bg-secondary/80">
                          {code}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <p className="font-medium">{code}</p>
                          {description && <p className="text-muted-foreground">{description}</p>}
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
                return <span className="text-sm text-muted-foreground">-</span>;
              }
              if (typeof cnaeRaw === "object") {
                const cnae = cnaeRaw as { codigo?: string; code?: string; descricao?: string; description?: string };
                const code = cnae.codigo || cnae.code;
                const description = cnae.descricao || cnae.description;
                if (code) {
                  return (
                    <Popover>
                      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm cursor-pointer hover:bg-secondary/80">
                          {code}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <p className="font-medium">{code}</p>
                          {description && <p className="text-muted-foreground">{description}</p>}
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "cnae_secundarios": {
              const cnaesRaw = enrichment.cnae_secundarios ?? enrichment.cnae_secondary ?? enrichment.secondary_cnaes ?? enrichment.cnaes_secundarios;
              if (Array.isArray(cnaesRaw) && cnaesRaw.length > 0) {
                const parsedCnaes = cnaesRaw.map((cnaeItem) => {
                  if (typeof cnaeItem === "string") {
                    const parts = cnaeItem.split(" - ");
                    return {
                      code: parts[0]?.trim(),
                      description: parts.length > 1 ? parts.slice(1).join(" - ").trim() : undefined,
                    };
                  }
                  const cnae = cnaeItem as { codigo?: string; code?: string; descricao?: string; description?: string };
                  return {
                    code: cnae.codigo ?? cnae.code,
                    description: cnae.descricao ?? cnae.description,
                  };
                }).filter((c) => c.code);

                if (parsedCnaes.length === 0) {
                  return <span className="text-sm text-muted-foreground">-</span>;
                }

                const displayCodes = parsedCnaes.slice(0, 3).map((c) => c.code).join(", ");
                const remainingCount = parsedCnaes.length > 3 ? parsedCnaes.length - 3 : 0;

                return (
                  <Popover>
                    <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 items-center cursor-pointer">
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm hover:bg-secondary/80">
                          {displayCodes}{remainingCount > 0 ? ` +${remainingCount}` : ""}
                        </Badge>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 text-sm max-h-80 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-3">
                        <p className="font-medium text-muted-foreground">CNAEs Secundários ({parsedCnaes.length})</p>
                        {parsedCnaes.map((cnae, index) => (
                          <div key={index} className="space-y-0.5 pb-2 border-b last:border-0 last:pb-0">
                            <p className="font-medium">{cnae.code}</p>
                            {cnae.description && <p className="text-muted-foreground text-xs">{cnae.description}</p>}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "establishment_identifier": {
              const identifier = enrichment.establishment_identifier as { descricao?: string; description?: string } | string | null;
              let identifierText: string | undefined;
              if (typeof identifier === "string" && identifier) {
                identifierText = identifier;
              } else if (typeof identifier === "object" && identifier) {
                identifierText = identifier.description || identifier.descricao;
              }
              if (identifierText) {
                return (
                  <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm">
                    {identifierText}
                  </Badge>
                );
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "activity_start_date":
            case "registration_status_date": {
              const dateValue = enrichment[brazilColumn.field] as string | null;
              if (dateValue) {
                try {
                  const date = new Date(dateValue);
                  const formatted = date.toLocaleDateString("pt-BR");
                  return <span className="text-sm truncate">{formatted}</span>;
                } catch {
                  return <span className="text-sm truncate">{dateValue}</span>;
                }
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "legal_nature": {
              const legalNature = enrichment.legal_nature as { description?: string; codigo?: string; descricao?: string } | string | null;
              if (typeof legalNature === "string" && legalNature) {
                return <span className="text-sm truncate" title={legalNature}>{legalNature}</span>;
              }
              if (typeof legalNature === "object" && legalNature) {
                const description = legalNature.description || legalNature.descricao;
                if (description) {
                  return <span className="text-sm truncate" title={description}>{description}</span>;
                }
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "economic_sector": {
              const sector = enrichment.economic_sector as string | null;
              if (sector) {
                return <span className="text-sm truncate" title={sector}>{sector}</span>;
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "simples.mei_option":
            case "simples.simples_option": {
              const simples = enrichment.simples as { mei_option?: boolean; simples_option?: boolean } | null;
              const isMei = brazilColumn.field === "simples.mei_option";
              const optionValue = isMei ? simples?.mei_option : simples?.simples_option;
              if (optionValue === true) {
                return (
                  <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                );
              } else if (optionValue === false) {
                return (
                  <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <X className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                );
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "registration_status": {
              const status = enrichment.registration_status as { description?: string; descricao?: string } | string | null;
              let statusText: string | undefined;
              if (typeof status === "string" && status) {
                statusText = status;
              } else if (typeof status === "object" && status) {
                statusText = status.description || status.descricao;
              }
              if (statusText) {
                return (
                  <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm">
                    {statusText}
                  </Badge>
                );
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            case "partners": {
              const partnersRaw = enrichment.partners as Array<{
                name?: string;
                nome?: string;
                faixa_etaria?: { descricao?: string };
                qualificacao?: { descricao?: string };
                identificador?: { descricao?: string };
              }> | null;
              if (partnersRaw && partnersRaw.length > 0) {
                return (
                  <div className="flex gap-1 overflow-hidden">
                    {partnersRaw.slice(0, 2).map((partner, index) => {
                      const partnerName = partner.name || partner.nome;
                      if (!partnerName) return null;
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Badge variant="secondary" className="text-[10px] whitespace-nowrap rounded-sm shrink-0 cursor-pointer hover:bg-secondary/80">
                              {partnerName}
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 text-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2">
                              <p className="font-medium">{partnerName}</p>
                              {partner.faixa_etaria?.descricao && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Age Range:</span> {partner.faixa_etaria.descricao}
                                </p>
                              )}
                              {partner.qualificacao?.descricao && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Qualification:</span> {partner.qualificacao.descricao}
                                </p>
                              )}
                              {partner.identificador?.descricao && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Identifier:</span> {partner.identificador.descricao}
                                </p>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                    {partnersRaw.length > 2 && (
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap rounded-sm shrink-0">
                        +{partnersRaw.length - 2}
                      </Badge>
                    )}
                  </div>
                );
              }
              return <span className="text-sm text-muted-foreground">-</span>;
            }
            default:
              return <span className="text-sm text-muted-foreground">-</span>;
          }
        }

        if (brazilColumn) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        return null;
      }
    }
  };

  const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );

  const getColumnIcon = (columnId: ColumnId) => {
    const iconClass = "h-3 w-3 text-muted-foreground";
    switch (columnId) {
      case "name":
        return <Type className={iconClass} />;
      case "description":
        return <FileText className={iconClass} />;
      case "industry":
        return <Briefcase className={iconClass} />;
      case "employees":
        return <Users className={iconClass} />;
      case "revenue":
        return <DollarSign className={iconClass} />;
      case "location":
        return <MapPin className={iconClass} />;
      case "domain":
        return <Globe className={iconClass} />;
      case "linkedin":
        return <LinkedInIcon className={iconClass} />;
      case "brazil_cnpj":
        return <Hash className={iconClass} />;
      case "brazil_share_capital":
        return <DollarSign className={iconClass} />;
      case "brazil_primary_cnae":
      case "brazil_secondary_cnae":
        return <Factory className={iconClass} />;
      case "brazil_establishment_identifier":
        return <Building2 className={iconClass} />;
      case "brazil_activity_start_date":
      case "brazil_registration_status_date":
        return <Calendar className={iconClass} />;
      case "brazil_legal_nature":
        return <FileText className={iconClass} />;
      case "brazil_economic_sector":
        return <Briefcase className={iconClass} />;
      case "brazil_mei":
      case "brazil_simples":
        return <CircleDot className={iconClass} />;
      case "brazil_registration_status":
        return <FileText className={iconClass} />;
      case "brazil_partners":
        return <Users className={iconClass} />;
      default:
        if (columnId.startsWith("tech_")) {
          return <Cpu className={iconClass} />;
        }
        return null;
    }
  };

  const renderHeaderContent = (column: Column) => {
    if (column.id === "select") {
      const checkboxState = allSelected ? true : someSelected ? "indeterminate" : false;
      return (
        <div className="flex items-center justify-center w-full">
          <Checkbox
            checked={checkboxState}
            onCheckedChange={handleSelectAll}
            className="cursor-pointer"
          />
        </div>
      );
    }

    const icon = getColumnIcon(column.id);
    const label = column.label;

    const threePartMatch = label.match(/^(Company)\s+(Technology|Brazil)\s+(.+)$/i);
    if (threePartMatch) {
      return (
        <span className="flex items-center gap-1.5">
          {icon}
          {threePartMatch[1]}
          <ChevronRight className="h-3 w-3" />
          {threePartMatch[2]}
          <ChevronRight className="h-3 w-3" />
          {threePartMatch[3]}
        </span>
      );
    }

    const twoPartMatch = label.match(/^(Company)\s+(.+)$/i);
    if (twoPartMatch) {
      return (
        <span className="flex items-center gap-1.5">
          {icon}
          {twoPartMatch[1]}
          <ChevronRight className="h-3 w-3" />
          {twoPartMatch[2]}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full w-full">
        <Table className="w-max min-w-full">
          <TableHeader className="sticky top-0 z-20 bg-card after:absolute after:left-0 after:bottom-0 after:w-full after:h-px after:bg-border">
            <TableRow className="group hover:bg-transparent border-b-0">
              <SortableContext
                items={visibleColumns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {visibleColumns.map((column) => (
                  <SortableHeader
                    key={column.id}
                    column={column}
                    onAutoResize={handleAutoResize}
                    isResizing={resizingColumnId === column.id}
                    onResizeStart={handleResizeStart}
                  >
                    {renderHeaderContent(column)}
                  </SortableHeader>
                ))}
              </SortableContext>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, index) => {
              const businessId = getBusinessId(company);
              const isSelected = selectedIds.includes(businessId);
              return (
                <TableRow
                  key={businessId || `company-${index}`}
                  className={cn(
                    "group transition-colors cursor-pointer border-b",
                    isSelected ? "bg-muted" : "hover:bg-muted/50"
                  )}
                  onClick={() => onCompanyClick?.(company)}
                  onMouseEnter={() => setHoveredRowId(businessId)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  {visibleColumns.map((column, colIndex) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "py-1.5 overflow-hidden relative transition-colors",
                        column.id !== "select" && "pr-4",
                        column.id === "select" && "px-0",
                        !column.sticky && "border-r",
                        column.sticky && "sticky",
                        column.sticky && (isSelected ? "bg-muted" : "bg-card group-hover:bg-muted"),
                        colIndex === visibleColumns.length - 1 && "border-r-0",
                        (column.id === "select" || column.id === "name") && "after:absolute after:right-0 after:top-0 after:h-screen after:w-px after:bg-border"
                      )}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                        ...(column.sticky && {
                          left: column.stickyOffset ?? 0,
                          zIndex: 10,
                        }),
                      }}
                    >
                      {renderCellContent(column.id, company, index)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {/* Empty row for bottom border */}
            {companies.length > 0 && (
              <TableRow className="border-b hover:bg-transparent">
                <TableCell colSpan={visibleColumns.length} className="h-0 p-0" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DndContext>
  );
}
