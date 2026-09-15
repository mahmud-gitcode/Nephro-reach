"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listTestimonials, saveTestimonials } from "./testimonials.repository";
import {
  applyTestimonialStatus,
  buildTestimonial,
  withoutTestimonial,
  type TestimonialDraft,
} from "./testimonials.rules";
import type { Testimonial } from "./testimonials.types";

export type { Testimonial } from "./testimonials.types";
export type { TestimonialDraft } from "./testimonials.rules";
export {
  approvedTestimonials,
  testimonialsByAuthor,
} from "./testimonials.rules";

export const testimonialsKey = ["testimonials", "all"] as const;

export function useTestimonials() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: testimonialsKey,
    queryFn: listTestimonials,
  });

  const write = useMutation({
    mutationFn: async (transform: (current: Testimonial[]) => Testimonial[]) =>
      saveTestimonials(transform(await listTestimonials())),
    onSuccess: (testimonials) =>
      queryClient.setQueryData(testimonialsKey, testimonials),
  });

  return {
    testimonials: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    submit: (draft: TestimonialDraft) =>
      write.mutateAsync((current) => [
        buildTestimonial(draft, crypto.randomUUID()),
        ...current,
      ]),
    setStatus: (
      id: string,
      status: Testimonial["status"],
      adminFeedback?: string,
    ) =>
      write.mutateAsync((current) =>
        applyTestimonialStatus(current, id, status, adminFeedback),
      ),
    remove: (id: string) =>
      write.mutateAsync((current) => withoutTestimonial(current, id)),

    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}
