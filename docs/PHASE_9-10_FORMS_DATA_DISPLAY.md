# Phase 9-10: Forms & Data Display

## Overview

Advanced form handling with validation, data tables with sorting/filtering, and chart integration.

---

## Phase 9: Advanced Form Handling

### FormBuilder Utility

```typescript
// lib/formBuilder.ts
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "date"
    | "select"
    | "checkbox"
    | "radio"
    | "textarea";
  placeholder?: string;
  required?: boolean;
  validation?: (value: any) => string | null;
  options?: Array<{ label: string; value: string }>;
}

export interface FormConfig {
  fields: FormField[];
  onSubmit: (data: any) => void;
  defaultValues?: any;
}

// Usage in pages
const form = new FormBuilder(config);
const errors = form.validate(formData);
const isValid = form.isValid(formData);
```

### Form Validation Patterns

#### Built-in Validators

```typescript
// validators/index.ts
export const Validators = {
  required: (value) => !value ? 'This field is required' : null,
  email: (value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email' : null,
  minLength: (min) => (value) => value?.length < min ? `Minimum ${min} characters` : null,
  maxLength: (max) => (value) => value?.length > max ? `Maximum ${max} characters` : null,
  pattern: (regex, msg) => (value) => !regex.test(value) ? msg : null,
  match: (target, msg) => (value) => value !== target ? msg : null,
};

// Usage
<Input
  {...field}
  validation={[
    Validators.required,
    Validators.email,
    Validators.minLength(6),
  ]}
/>
```

### React Hook Form Integration

#### Setup

```typescript
// pages/example_form.tsx
import { useForm } from 'react-hook-form';
import { Input, Select, Checkbox, Button } from '@/components/ui';

export default function ExampleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email"
        {...register('email', { required: 'Email required' })}
        error={errors.email?.message}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Custom Form Components with Integration

#### FormGroup Component

```typescript
// components/ui/FormGroup.tsx
export interface FormGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({ title, description, children }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-xs text-neutral-500">{description}</p>}
    </div>
    {children}
  </div>
);
```

#### MultiSelect Component

```typescript
// components/ui/MultiSelect.tsx
export interface MultiSelectProps {
  label: string;
  options: Array<{ label: string; value: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  maxSelections,
}) => {
  // Implementation with search, tagging, limit checks
};
```

#### DateRangePicker Component

```typescript
// components/ui/DateRangePicker.tsx
export interface DateRangePickerProps {
  label: string;
  startDate?: Date;
  endDate?: Date;
  onChange: (start: Date, end: Date) => void;
  disabled?: (date: Date) => boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  startDate,
  endDate,
  onChange,
  disabled,
}) => {
  // Calendar UI with range selection
};
```

### Form State Management

#### Zustand Store Pattern

```typescript
// stores/formStore.ts
import create from "zustand";

interface FormState {
  forms: Record<string, any>;
  setFormData: (formId: string, data: any) => void;
  getFormData: (formId: string) => any;
  resetForm: (formId: string) => void;
  submitForm: (formId: string) => Promise<void>;
}

export const useFormStore = create<FormState>((set, get) => ({
  forms: {},
  setFormData: (formId, data) =>
    set((state) => ({
      forms: { ...state.forms, [formId]: data },
    })),
  getFormData: (formId) => get().forms[formId] || {},
  resetForm: (formId) =>
    set((state) => ({
      forms: { ...state.forms, [formId]: {} },
    })),
  submitForm: async (formId) => {
    const data = get().getFormData(formId);
    // Handle submission
  },
}));
```

---

## Phase 10: Data Display & Visualization

### Advanced Table Component

#### DataTable Props

```typescript
// components/ui/DataTable.tsx
export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  selection?: SelectionConfig;
  onRowClick?: (row: T) => void;
}

export interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}
```

#### DataTable Features

```typescript
// Sorting
<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
  ]}
  sorting={{
    field: 'name',
    direction: 'asc',
    onChange: (field, direction) => { /* handle */ }
  }}
/>

// Filtering
<DataTable
  filtering={{
    filters: [
      { field: 'status', operator: 'equals', value: 'active' },
      { field: 'email', operator: 'contains', value: 'gmail' },
    ],
    onChange: (filters) => { /* handle */ }
  }}
/>

// Pagination
<DataTable
  pagination={{
    pageSize: 10,
    currentPage: 1,
    total: 100,
    onChange: (page) => { /* handle */ }
  }}
/>

// Row Selection
<DataTable
  selection={{
    mode: 'checkbox', // or 'radio'
    selected: selectedRows,
    onChange: (rows) => { /* handle */ }
  }}
/>
```

#### DataTable Example Usage

```typescript
// pages/users_management.tsx
import { DataTable } from '@/components/ui';

export default function UsersPage() {
  const [sorting, setSorting] = useState({ field: 'name', direction: 'asc' });
  const [filters, setFilters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10 });

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <Badge variant={status === 'active' ? 'success' : 'warning'}>{status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button size="sm" onClick={() => editUser(row.id)}>Edit</Button>
      ),
    },
  ];

  return <DataTable data={users} columns={columns} {...props} />;
}
```

### Chart Components

#### Chart.js Integration

```typescript
// components/charts/LineChart.tsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export interface LineChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
  title?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ labels, datasets, title }) => (
  <Line
    data={{ labels, datasets }}
    options={{
      responsive: true,
      plugins: { legend: { position: 'top' }, title: { display: !!title, text: title } },
    }}
  />
);
```

#### Bar Chart Component

```typescript
// components/charts/BarChart.tsx
import { Bar } from 'react-chartjs-2';

export interface BarChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
  }>;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ labels, datasets, title }) => (
  <Bar data={{ labels, datasets }} options={{ responsive: true, ... }} />
);
```

#### Pie Chart Component

```typescript
// components/charts/PieChart.tsx
import { Pie } from 'react-chartjs-2';

export interface PieChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
  title?: string;
}

export const PieChart: React.FC<PieChartProps> = ({ labels, data, colors, title }) => (
  <Pie
    data={{
      labels,
      datasets: [{
        data,
        backgroundColor: colors || CHART_COLORS,
      }],
    }}
    options={{ responsive: true, ... }}
  />
);
```

### Chart Usage in Pages

#### Analytics Page with Charts

```typescript
// pages/analytics_enhanced.tsx
import { LineChart, BarChart, PieChart } from '@/components/charts';

export default function AnalyticsPage() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Performance Trend */}
      <Card>
        <LineChart
          labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
          datasets={[{
            label: 'Average Score',
            data: [72, 75, 78, 82, 80, 85],
            borderColor: '#3B82F6',
          }]}
        />
      </Card>

      {/* Subject Performance */}
      <Card>
        <BarChart
          labels={['Anatomy', 'Biochemistry', 'Pharmacology', 'Pathology']}
          datasets={[{
            label: 'Accuracy %',
            data: [82, 78, 88, 75],
            backgroundColor: '#10B981',
          }]}
        />
      </Card>

      {/* Time Distribution */}
      <Card>
        <PieChart
          labels={['MCQs', 'Flashcards', 'Mock Exams', 'Videos']}
          data={[40, 25, 20, 15]}
        />
      </Card>
    </div>
  );
}
```

### Data Export Functionality

#### CSV Export Utility

```typescript
// lib/exporters.ts
export const exportToCSV = (data: any[], filename: string) => {
  const csv = convertToCSV(data);
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
  );
  element.setAttribute("download", `${filename}.csv`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const exportToPDF = async (data: any[], filename: string) => {
  // Implementation using jsPDF or similar
};

export const exportToExcel = async (data: any[], filename: string) => {
  // Implementation using xlsx or similar
};
```

---

## Implementation Checklist

### Form Components

- [x] Input with validation
- [x] Select with options
- [x] Checkbox group
- [x] Radio group
- [ ] DatePicker (to create)
- [ ] MultiSelect (to create)
- [ ] DateRangePicker (to create)
- [ ] FormGroup (to create)

### Data Display Components

- [ ] DataTable (to create)
- [ ] Pagination (to create)
- [ ] LineChart (to integrate)
- [ ] BarChart (to integrate)
- [ ] PieChart (to integrate)
- [ ] Donut Chart (to create)
- [ ] Table Filters (to create)

### Integrations

- [ ] React Hook Form
- [ ] Chart.js / Recharts
- [ ] Data export (CSV/PDF/Excel)
- [ ] Advanced sorting
- [ ] Advanced filtering
- [ ] Search functionality

---

## Performance Considerations

### Form Performance

- Lazy validate (validate on blur)
- Debounce async validation
- Memoize form components
- Use useCallback for handlers

### Table Performance

- Virtual scrolling for large datasets
- Lazy load rows
- Memo table rows
- Pagination to limit data

### Chart Performance

- Lazy load chart library
- Debounce data updates
- Use canvas for large datasets
- Optimize animations

---

## Status: ✅ ARCHITECTURE COMPLETE

- Form validation patterns defined
- Data table structure designed
- Chart integration planned
- Export utilities documented
- Ready for component implementation
