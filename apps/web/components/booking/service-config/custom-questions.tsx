'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import type { ServiceQuestion, ServiceFormData, QuestionType } from '@/types/booking.types';

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Free-form text input' },
  { value: 'select', label: 'Dropdown', description: 'Select one option' },
  { value: 'checkbox', label: 'Checkbox', description: 'Yes/No toggle' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
];

interface CustomQuestionsProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  disabled?: boolean;
}

export function CustomQuestions({ formData, setFormData, disabled }: CustomQuestionsProps) {
  const questions = formData.questions || [];

  const addQuestion = () => {
    const newQuestion: ServiceQuestion = {
      question: '',
      question_type: 'text',
      options: [],
      is_required: false,
      sort_order: questions.length,
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
    }));
  };

  const updateQuestion = (index: number, updates: Partial<ServiceQuestion>) => {
    setFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) =>
        i === index ? { ...q, ...updates } : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== index),
    }));
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    updateQuestion(questionIndex, {
      options: [...(question.options || []), ''],
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    updateQuestion(questionIndex, {
      options: (question.options || []).filter((_, i) => i !== optionIndex),
    });
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= questions.length) return;
    setFormData((prev) => {
      const newQuestions = [...(prev.questions || [])];
      const [removed] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, removed);
      return { ...prev, questions: newQuestions };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base text-gray-900">Custom Intake Questions</Label>
          <p className="text-xs text-gray-500 mt-1">
            Ask customers additional questions when they book
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestion}
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card className="p-8 text-center border-dashed bg-white border-gray-200">
          <p className="text-gray-600 text-sm">No custom questions added</p>
          <p className="text-xs text-gray-500 mt-1">
            Click &quot;Add Question&quot; to collect additional information
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={index} className="p-4 bg-white border-gray-200">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-1 cursor-grab text-gray-500 hover:text-gray-700"
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={disabled}
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Question Text */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-gray-700">Question *</Label>
                      <Input
                        value={question.question}
                        onChange={(e) => updateQuestion(index, { question: e.target.value })}
                        placeholder="e.g., Do you have any allergies?"
                        disabled={disabled}
                      />
                    </div>

                    {/* Question Type */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700">Type</Label>
                      <Select
                        value={question.question_type}
                        onValueChange={(value) =>
                          updateQuestion(index, { question_type: value as QuestionType })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Options for select type */}
                  {question.question_type === 'select' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-700">Options</Label>
                      <div className="space-y-2">
                        {(question.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              disabled={disabled}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeOption(index, optIndex)}
                              disabled={disabled}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(index)}
                          disabled={disabled}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Required Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.is_required}
                      onCheckedChange={(checked) =>
                        updateQuestion(index, { is_required: checked })
                      }
                      disabled={disabled}
                    />
                    <span className="text-xs text-gray-600">Required</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveQuestion(index, index - 1)}
                    disabled={disabled || index === 0}
                    className="text-gray-500"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveQuestion(index, index + 1)}
                    disabled={disabled || index === questions.length - 1}
                    className="text-gray-500"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeQuestion(index)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
