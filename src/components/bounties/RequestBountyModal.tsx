"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateBountyRequest } from "@/hooks/queries";
import { createBountyRequestSchema } from "@/validations/bounty.schema";

interface RequestBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyId: string;
  bountyTitle: string;
}

type FormData = z.infer<typeof createBountyRequestSchema>;

export function RequestBountyModal({
  open,
  onOpenChange,
  bountyId,
  bountyTitle,
}: RequestBountyModalProps) {
  const [charCount, setCharCount] = useState(0);
  const createRequestMutation = useCreateBountyRequest();

  const form = useForm<FormData>({
    resolver: zodResolver(createBountyRequestSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleSubmit = (data: FormData) => {
    createRequestMutation.mutate(
      {
        bountyId,
        message: data.message,
      },
      {
        onSuccess: () => {
          form.reset();
          setCharCount(0);
          onOpenChange(false);
        },
      }
    );
  };

  const handleMessageChange = (value: string) => {
    setCharCount(value.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request to Work on This Bounty</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Send a request to work on <span className="font-medium">{bountyTitle}</span>. You can
            optionally include a message explaining your interest and qualifications.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the workspace admins why you'd like to work on this bounty..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessageChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">{charCount} / 1000 characters</p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createRequestMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
