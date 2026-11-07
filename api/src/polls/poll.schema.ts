import { InferSchemaType, Schema } from 'mongoose';

// MongoDB adds an _id to every poll automatically (used as the poll id in URLs).
export const PollSchema = new Schema({
  question: { type: String, required: true },

  // Options have an id that votes can refer to
  options: [{ text: { type: String, required: true } }],

  // Votes live inside the poll so each vote/close is one atomic update.
  votes: [{ _id: false, participantId: String, optionId: Schema.Types.ObjectId }],

  closed: { type: Boolean, default: false },
});

// The TypeScript type is generated from the schema, so the shape is defined once.
export type Poll = InferSchemaType<typeof PollSchema>;
