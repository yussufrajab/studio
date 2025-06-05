'use server';

/**
 * @fileOverview This file defines a Genkit flow for intelligently routing employee requests to the correct category and reviewer.
 *
 * - analyzeRequest - A function that analyzes the request and returns suggested category and reviewer.
 * - AnalyzeRequestInput - The input type for the analyzeRequest function.
 * - AnalyzeRequestOutput - The return type for the analyzeRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeRequestInputSchema = z.object({
  requestDescription: z
    .string()
    .describe('The description of the employee request.'),
  employeeDetails: z
    .string()
    .optional()
    .describe('Details of the employee making the request, if available.'),
});
export type AnalyzeRequestInput = z.infer<typeof AnalyzeRequestInputSchema>;

const AnalyzeRequestOutputSchema = z.object({
  suggestedCategory: z
    .string()
    .describe('The suggested category for the request.'),
  suggestedReviewer: z
    .string()
    .describe('The suggested HHRMD/HRMO reviewer for the request.'),
  justification: z
    .string()
    .describe('The justification for the suggested category and reviewer.'),
});
export type AnalyzeRequestOutput = z.infer<typeof AnalyzeRequestOutputSchema>;

export async function analyzeRequest(input: AnalyzeRequestInput): Promise<AnalyzeRequestOutput> {
  return analyzeRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeRequestPrompt',
  input: {schema: AnalyzeRequestInputSchema},
  output: {schema: AnalyzeRequestOutputSchema},
  prompt: `You are an AI assistant designed to analyze employee requests and suggest the correct category and reviewer.

  Based on the request description and any available employee details, determine the most appropriate request category and the HHRMD/HRMO reviewer to whom the request should be routed.

  Provide a brief justification for your suggestions.

  Request Description: {{{requestDescription}}}
  Employee Details: {{{employeeDetails}}}
  Output the suggested category, reviewer, and justification in JSON format.

  Here are the possible request categories:
  - Employee Confirmation
  - Leave Without Pay (LWOP)
  - Promotion
  - Complaints
  - Change of Cadre
  - Retirement
  - Resignation (Employee)
  - Service Extension
  - Termination
  - Dismissal

  Here are the possible reviewers:
  - HHRMD/HRMO
  - DO

  Make sure the output can be parsed by JSON.parse.
  `,
});

const analyzeRequestFlow = ai.defineFlow(
  {
    name: 'analyzeRequestFlow',
    inputSchema: AnalyzeRequestInputSchema,
    outputSchema: AnalyzeRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
