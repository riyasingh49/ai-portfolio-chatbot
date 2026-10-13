export const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'draft_email',
        description:
          "Drafts an email based on the user's request. Use this whenever the user asks to write, draft, or compose an email.",
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description:
                'The recipient email address, if the user specified one. Leave empty if not specified.',
            },
            subject: {
              type: 'string',
              description: 'A concise, relevant subject line for the email.',
            },
            body: {
              type: 'string',
              description:
                'The full email body text, written naturally and appropriately for the context.',
            },
          },
          required: ['subject', 'body'],
        },
      },
    },
  ];
  
  export type EmailDraft = {
    to: string;
    subject: string;
    body: string;
  };