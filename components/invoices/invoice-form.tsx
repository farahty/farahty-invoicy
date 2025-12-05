"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createInvoice,
  updateInvoice,
  getItemSuggestions,
} from "@/actions/invoices";
import type { Client, Invoice, InvoiceItem } from "@/db/schema";
import { cn } from "@/lib/utils";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be 0 or greater"),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  taxRate: z.number().min(0).max(100),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  clients: Client[];
  invoice?: Invoice & { items: InvoiceItem[] };
  defaultClientId?: string;
}

export function InvoiceForm({
  clients,
  invoice,
  defaultClientId,
}: InvoiceFormProps) {
  const router = useRouter();
  const isEditing = !!invoice;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: invoice?.clientId || defaultClientId || "",
      date: invoice
        ? format(new Date(invoice.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      dueDate: invoice
        ? format(new Date(invoice.dueDate), "yyyy-MM-dd")
        : format(addDays(new Date(), 30), "yyyy-MM-dd"),
      taxRate: invoice ? parseFloat(invoice.taxRate) : 0,
      notes: invoice?.notes || "",
      terms: invoice?.terms || "",
      items: invoice?.items.map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
      })) || [{ description: "", quantity: 1, rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedTaxRate = form.watch("taxRate");

  // Calculate totals
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  );
  const taxAmount = (subtotal * (watchedTaxRate || 0)) / 100;
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      const payload = {
        ...data,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
      };

      if (isEditing) {
        const result = await updateInvoice(invoice.id, payload);
        if (result.success) {
          toast.success("Invoice updated successfully");
          router.push(`/invoices/${invoice.id}`);
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update invoice");
        }
      } else {
        const result = await createInvoice(payload);
        if (result.success) {
          toast.success("Invoice created successfully");
          router.push(`/invoices/${result.invoice?.id}`);
          router.refresh();
        }
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client & Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 text-sm font-medium text-slate-500 w-[40%]">
                      Description
                    </th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-slate-500 w-[15%]">
                      Qty
                    </th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-slate-500 w-[20%]">
                      Rate
                    </th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-slate-500 w-[20%]">
                      Amount
                    </th>
                    <th className="w-[5%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-b border-slate-100">
                      <td className="py-2 px-2 overflow-visible">
                        <InvoiceItemDescriptionField
                          control={form.control}
                          index={index}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  className="text-right"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="text-right"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {formatCurrency(
                          (watchedItems[index]?.quantity || 0) *
                            (watchedItems[index]?.rate || 0)
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-slate-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-slate-500">
                      Item {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 -mr-2 -mt-2"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <InvoiceItemDescriptionField
                    control={form.control}
                    index={index}
                    label="Description"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.rate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Rate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-sm text-slate-500">Amount</span>
                    <span className="font-medium">
                      {formatCurrency(
                        (watchedItems[index]?.quantity || 0) *
                          (watchedItems[index]?.rate || 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => append({ description: "", quantity: 1, rate: 0 })}
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>

            {form.formState.errors.items?.root && (
              <p className="text-sm text-red-500">
                {form.formState.errors.items.root.message}
              </p>
            )}

            {/* Totals */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">Tax</span>
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                className="pr-8 text-right"
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                %
                              </span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <span className="w-24 text-right">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes to the client..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Payment terms, late fees, etc..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Smart item description field with autocomplete (tag-style combobox)
function InvoiceItemDescriptionField({
  control,
  index,
  label,
}: {
  control: ReturnType<typeof useForm<InvoiceFormValues>>["control"];
  index: number;
  label?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSuggestions = useCallback(async (q: string) => {
    try {
      const results = await getItemSuggestions(q);
      setSuggestions(results);
      setHasFetched(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (open) {
        fetchSuggestions(query);
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [query, open, fetchSuggestions]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  return (
    <FormField
      control={control}
      name={`items.${index}.description`}
      render={({ field }) => {
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (!open || suggestions.length === 0) return;

          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : 0
              );
              break;
            case "ArrowUp":
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : suggestions.length - 1
              );
              break;
            case "Enter":
              if (
                highlightedIndex >= 0 &&
                highlightedIndex < suggestions.length
              ) {
                e.preventDefault();
                field.onChange(suggestions[highlightedIndex]);
                setOpen(false);
                setHighlightedIndex(-1);
              }
              break;
            case "Escape":
              setOpen(false);
              setHighlightedIndex(-1);
              break;
            case "Tab":
              if (
                highlightedIndex >= 0 &&
                highlightedIndex < suggestions.length
              ) {
                field.onChange(suggestions[highlightedIndex]);
              }
              setOpen(false);
              break;
          }
        };

        return (
          <FormItem className="flex flex-col relative">
            {label && <FormLabel className="text-xs">{label}</FormLabel>}
            <FormControl>
              <Input
                placeholder="Type to search or add new..."
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => {
                  if (field.value) {
                    setQuery(field.value);
                  }
                  setOpen(true);
                }}
                onBlur={() => {
                  // Delay closing to allow click on suggestion
                  setTimeout(() => {
                    setOpen(false);
                    setHighlightedIndex(-1);
                  }, 150);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
            </FormControl>
            {open && suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-100 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto min-w-[250px]">
                <div className="py-1">
                  <p className="px-3 py-1.5 text-xs font-medium text-slate-500 border-b border-slate-100 mb-1">
                    Suggestions
                  </p>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={suggestion}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm cursor-pointer flex items-center gap-2",
                        highlightedIndex === idx
                          ? "bg-slate-100 text-slate-900"
                          : "hover:bg-slate-50 text-slate-700"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        field.onChange(suggestion);
                        setOpen(false);
                        setHighlightedIndex(-1);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      <span className="flex-1 truncate">{suggestion}</span>
                      {highlightedIndex === idx && (
                        <span className="text-xs text-slate-400">
                          Enter to select
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
