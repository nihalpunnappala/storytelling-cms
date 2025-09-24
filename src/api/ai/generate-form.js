import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
You are a form builder AI assistant. Based on the user's description, generate a JSON array of form fields.

User Description: "${description}"

Generate form fields with the following structure:
{
  "label": "Field Label",
  "type": "field_type",
  "placeholder": "Placeholder text",
  "required": true/false,
  "options": ["option1", "option2"] // only for select/multiSelect fields
}

Available field types:
- text: For text input
- email: For email addresses
- number: For numeric input
- password: For password fields
- mobilenumber: For phone numbers
- date: For date selection
- time: For time selection
- textarea: For long text
- select: For dropdown selection
- multiSelect: For multiple selection
- checkbox: For yes/no questions
- file: For file uploads

Rules:
1. Generate 3-8 relevant fields based on the description
2. Always include essential fields like name and email for registration forms
3. Make fields required only if they are truly essential
4. Use appropriate field types for the data being collected
5. Provide clear, user-friendly labels
6. Add helpful placeholder text
7. For select fields, provide realistic options
8. Return only valid JSON array, no additional text

Example output:
[
  {
    "label": "Full Name",
    "type": "text",
    "placeholder": "Enter your full name",
    "required": true
  },
  {
    "label": "Email Address",
    "type": "email",
    "placeholder": "Enter your email",
    "required": true
  }
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let fields;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        fields = JSON.parse(jsonMatch[0]);
      } else {
        fields = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      // Fallback to a basic form structure
      fields = [
        {
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true
        },
        {
          label: "Email Address",
          type: "email",
          placeholder: "Enter your email address",
          required: true
        },
        {
          label: "Message",
          type: "textarea",
          placeholder: "Enter your message",
          required: false
        }
      ];
    }

    // Validate and sanitize the fields
    const validatedFields = fields.map(field => ({
      label: field.label || 'Untitled Field',
      type: field.type || 'text',
      placeholder: field.placeholder || `Enter ${field.label?.toLowerCase() || 'value'}`,
      required: Boolean(field.required),
      ...(field.options && Array.isArray(field.options) && { options: field.options })
    }));

    res.status(200).json({ 
      success: true, 
      fields: validatedFields,
      message: 'Form generated successfully'
    });

  } catch (error) {
    console.error('AI form generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate form',
      error: error.message 
    });
  }
}