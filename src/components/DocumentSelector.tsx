import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import {
  FileText,
  X,
  Info,
  Clock,
  HardDrive,
  FileType,
} from 'lucide-react';
import type { DocumentType, LoanProductDocument } from '@/types';

interface DocumentSelectorProps {
  documentTypes: DocumentType[];
  selectedDocuments: Partial<LoanProductDocument>[];
  onChange: (documents: Partial<LoanProductDocument>[]) => void;
}

export function DocumentSelector({
  documentTypes,
  selectedDocuments,
  onChange,
}: DocumentSelectorProps) {
  const [availableDocuments, setAvailableDocuments] = useState<DocumentType[]>([]);

  useEffect(() => {
    // Filter out already selected documents
    const selectedIds = selectedDocuments.map(d => d.document_type_id);
    const available = documentTypes.filter(
      dt => dt.is_active && !selectedIds.includes(dt.id)
    );
    setAvailableDocuments(available);
  }, [documentTypes, selectedDocuments]);

  const addDocument = (documentTypeId: string) => {
    const documentType = documentTypes.find(dt => dt.id === documentTypeId);
    if (!documentType) return;

    const newDocument: Partial<LoanProductDocument> = {
      document_type_id: documentTypeId,
      document_type: documentType,
      is_mandatory: true,
      custom_instructions: '',
      display_order: selectedDocuments.length,
    };

    onChange([...selectedDocuments, newDocument]);
  };

  const removeDocument = (index: number) => {
    const updated = selectedDocuments.filter((_, i) => i !== index);
    // Update display_order for remaining documents
    const reordered = updated.map((doc, i) => ({
      ...doc,
      display_order: i,
    }));
    onChange(reordered);
  };

  const updateDocument = (index: number, updates: Partial<LoanProductDocument>) => {
    const updated = [...selectedDocuments];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const moveDocument = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedDocuments.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...selectedDocuments];
    const [movedDoc] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedDoc);

    // Update display_order
    const reordered = updated.map((doc, i) => ({
      ...doc,
      display_order: i,
    }));
    onChange(reordered);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
        <CardDescription>
          Select and configure documents required for this loan product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedDocuments.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No documents required yet
            </p>
            {availableDocuments.length > 0 && (
              <Select onValueChange={addDocument}>
                <SelectTrigger className="w-64 mx-auto">
                  <SelectValue placeholder="Add a required document" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocuments.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {selectedDocuments.map((doc, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveDocument(index, 'up');
                            }}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveDocument(index, 'down');
                            }}
                            disabled={index === selectedDocuments.length - 1}
                          >
                            ↓
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {doc.document_type?.name}
                          </span>
                          {doc.is_mandatory ? (
                            <Badge variant="default">Mandatory</Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDocument(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {doc.document_type?.description && (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {doc.document_type.description}
                        </div>
                      )}

                      <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`mandatory-${index}`}>
                            Mandatory Document
                          </Label>
                          <Switch
                            id={`mandatory-${index}`}
                            checked={doc.is_mandatory || false}
                            onCheckedChange={(checked) =>
                              updateDocument(index, { is_mandatory: checked })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`instructions-${index}`}>
                            Custom Instructions (optional)
                          </Label>
                          <Textarea
                            id={`instructions-${index}`}
                            placeholder="Additional instructions specific to this loan product..."
                            value={doc.custom_instructions || ''}
                            onChange={(e) =>
                              updateDocument(index, { custom_instructions: e.target.value })
                            }
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            These instructions will be shown in addition to the default instructions
                          </p>
                        </div>

                        <div className="border-t pt-3">
                          <div className="text-sm space-y-2">
                            <div className="flex items-center gap-2">
                              <FileType className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Accepted:</span>
                              <div className="flex gap-1">
                                {doc.document_type?.file_types.map(type => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type.toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Max size: {doc.document_type?.max_size_mb} MB
                              </span>
                            </div>
                            {doc.document_type?.validity_days && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Valid for: {doc.document_type.validity_days} days
                                </span>
                              </div>
                            )}
                            {doc.document_type?.instructions && (
                              <div className="flex items-start gap-2">
                                <Info className="h-3 w-3 text-muted-foreground mt-0.5" />
                                <span className="text-muted-foreground">
                                  Default: {doc.document_type.instructions}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {availableDocuments.length > 0 && (
              <div className="flex justify-center pt-4 border-t">
                <Select onValueChange={addDocument}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Add another document" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {availableDocuments.length === 0 && documentTypes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Info className="h-4 w-4 inline mr-2" />
            No document types defined. Please create document types first.
          </div>
        )}
      </CardContent>
    </Card>
  );
}