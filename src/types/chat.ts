export type EmailDraft = {
    to: string;
    subject: string;
    body: string;
  };
  
  export type chatMessage = {
    role: 'user' | 'assistant';
    content: string;
    emailDraft?: EmailDraft;
  };