// Gemini AI Service for Form Generation
import { quickFields, customFields } from "../components/project/pages/event/eventForm/styles";

class GeminiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
  }

  // Main method to generate form fields from user description
  async generateFormFields(description) {
    try {
      if (!this.apiKey) {
        throw new Error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.");
      }

      const prompt = this.buildPrompt(description);
      const response = await this.callGeminiAPI(prompt);
      const fields = this.parseGeminiResponse(response);

      return fields;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  // Build comprehensive prompt for Gemini
  buildPrompt(description) {
    const availableFields = [...quickFields, ...customFields];
    const fieldMapping = this.createFieldMapping();

    return `You are an expert form builder AI. Your task is to analyze a user's form description and suggest appropriate form fields, prioritizing PRESET fields over CUSTOM fields when available.

PRESET FIELDS (Use these first when they match user requests):
${this.formatPresetFields(quickFields)}

CUSTOM FIELDS (Use these only when no preset field matches):
${this.formatCustomFields(customFields)}

FIELD MAPPING GUIDE:
${this.formatFieldMapping(fieldMapping)}

USER REQUEST: "${description}"

INSTRUCTIONS:
1. ANALYZE the user's request intelligently to determine the BEST field type for each requirement
2. FIRST, check if the user's request mentions any PRESET fields and use those exact fields
3. SECOND, for any other requirements, INTELLIGENTLY choose the most appropriate field type based on context
4. THIRD, for select/multiSelect fields, GENERATE appropriate options based on the context

5. INTELLIGENT FIELD TYPE SELECTION:
   - Questions with "choose", "select", "which", "what type" → Use SELECT or MULTI-SELECT
   - Rating/satisfaction questions → Use SELECT with numbered options
   - Yes/No questions → Use SELECT with "Yes"/"No" options
   - Questions with multiple predefined options → Use SELECT or MULTI-SELECT
   - Long-form responses, comments, feedback → Use TEXTAREA
   - Numbers, quantities, ages → Use NUMBER
   - Dates → Use DATE
   - Times → Use TIME
   - File uploads → Use FILE
   - Rich text content → Use HTMLEDITOR

6. For each field, provide:
   - label: Create a clear, descriptive label based on the user's request
   - type: Choose the most appropriate field type based on the analysis above
   - placeholder: Create a helpful placeholder that guides the user
   - required: true if this is essential information, false if optional
   - options: For select/multiSelect fields, generate contextually appropriate options

7. FIELD SELECTION PRIORITY:
   - If user says "company" → Use PRESET "Company" field
   - If user says "designation" or "job title" → Use PRESET "Designation" field
   - If user says "name" → Use PRESET "Name" field
   - If user says "email" → Use PRESET "Email" field
   - If user says "phone" → Use PRESET "Phone" field
   - For everything else → INTELLIGENTLY choose the best field type

8. CRITICAL RULES:
   - Be SMART about field type selection based on the user's actual request
   - Generate RELEVANT options for select fields based on context
   - Use exact preset field names/labels when they clearly match
   - Only use field types that are explicitly listed above
   - ONLY include fields that are DIRECTLY MENTIONED or CLEARLY IMPLIED

9. Return ONLY a valid JSON array of field objects
10. Do not include any explanation or additional text - just the JSON array

EXAMPLE OUTPUT FORMAT:
[
  {
    "label": "Company",
    "type": "text",
    "placeholder": "Enter your company name",
    "required": false
  },
  {
    "label": "Job Satisfaction",
    "type": "select",
    "placeholder": "Select your satisfaction level",
    "required": false,
    "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
  },
  {
    "label": "Years of Experience",
    "type": "number",
    "placeholder": "Enter number of years",
    "required": false
  },
  {
    "label": "Additional Comments",
    "type": "textarea",
    "placeholder": "Please share any additional comments...",
    "required": false
  }
]

Now, based on the user's request, generate the appropriate form fields using preset fields when possible:`;
  }

  // Create field mapping for common terms
  createFieldMapping() {
    return {
      // Name related
      name: { label: "Name", type: "text", value: "Name" },
      "full name": { label: "Name", type: "text", value: "Name" },
      "first name": { label: "Name", type: "text", value: "Name" },
      "last name": { label: "Name", type: "text", value: "Name" },
      "person name": { label: "Name", type: "text", value: "Name" },

      // Email related
      email: { label: "Email", type: "email", value: "Email" },
      "email address": { label: "Email", type: "email", value: "Email" },
      "e-mail": { label: "Email", type: "email", value: "Email" },
      "contact email": { label: "Email", type: "email", value: "Email" },

      // Phone related
      phone: { label: "Phone", type: "mobilenumber", value: "Phone" },
      "phone number": { label: "Phone", type: "mobilenumber", value: "Phone" },
      mobile: { label: "Phone", type: "mobilenumber", value: "Phone" },
      "mobile number": { label: "Phone", type: "mobilenumber", value: "Phone" },
      telephone: { label: "Phone", type: "mobilenumber", value: "Phone" },

      // Company related
      company: { label: "Company", type: "text", value: "Company" },
      "company name": { label: "Company", type: "text", value: "Company" },
      organization: { label: "Company", type: "text", value: "Company" },
      organisation: { label: "Company", type: "text", value: "Company" },
      business: { label: "Company", type: "text", value: "Company" },

      // Designation related
      designation: { label: "Designation", type: "text", value: "Designation" },
      "job title": { label: "Designation", type: "text", value: "Designation" },
      position: { label: "Designation", type: "text", value: "Designation" },
      role: { label: "Designation", type: "text", value: "Designation" },
      title: { label: "Designation", type: "text", value: "Designation" },

      // Website related
      website: { label: "Website", type: "text", value: "Website" },
      "website url": { label: "Website", type: "text", value: "Website" },
      "web address": { label: "Website", type: "text", value: "Website" },
      url: { label: "Website", type: "text", value: "Website" },
      site: { label: "Website", type: "text", value: "Website" },

      // Country related
      country: { label: "Country", type: "select", value: "Country" },
      location: { label: "Country", type: "select", value: "Country" },
      region: { label: "Country", type: "select", value: "Country" },
      nation: { label: "Country", type: "select", value: "Country" },
    };
  }

  // Format preset fields for the prompt
  formatPresetFields(fields) {
    return fields.map((field) => `• ${field.label}: type="${field.type}", placeholder="${field.placeholder}"`).join("\n");
  }

  // Format custom fields for the prompt
  formatCustomFields(fields) {
    return fields.map((field) => `• ${field.label}: type="${field.type}", placeholder="${field.placeholder}"`).join("\n");
  }

  // Format field mapping guide
  formatFieldMapping(mapping) {
    const entries = Object.entries(mapping);
    return entries.map(([term, field]) => `"${term}" → ${field.label} (${field.type})`).join("\n");
  }

  // Format available fields for the prompt (legacy method - keeping for compatibility)
  formatAvailableFields(fields) {
    return fields.map((field) => `- ${field.label}: type="${field.type}", description="${field.placeholder}"`).join("\n");
  }

  // Call Gemini API
  async callGeminiAPI(prompt) {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data;
  }

  // Parse Gemini response and extract fields
  parseGeminiResponse(response) {
    try {
      // Extract text from Gemini response
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No response text from Gemini");
      }

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in Gemini response");
      }

      const fields = JSON.parse(jsonMatch[0]);

      // Validate and clean up the fields
      return this.validateAndCleanFields(fields);
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      console.error("Raw response:", response);
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  // Validate and clean up fields from Gemini response
  validateAndCleanFields(fields) {
    if (!Array.isArray(fields)) {
      throw new Error("Gemini response is not a valid array of fields");
    }

    const availableTypes = [...quickFields, ...customFields].map((f) => f.type);

    return fields.map((field) => {
      // Ensure required properties
      const cleanField = {
        label: field.label || "Untitled Field",
        type: field.type || "text",
        placeholder: field.placeholder || `Enter ${field.label || "value"}`,
        required: Boolean(field.required),
      };

      // Validate field type
      if (!availableTypes.includes(cleanField.type)) {
        console.warn(`Invalid field type "${cleanField.type}" from Gemini, defaulting to "text"`);
        cleanField.type = "text";
      }

      // Handle options for select fields
      if ((cleanField.type === "select" || cleanField.type === "multiSelect") && field.options) {
        if (Array.isArray(field.options)) {
          cleanField.options = field.options;
          cleanField.selectApi = field.options.join(",");
          cleanField.apiType = "CSV";
        }
      }

      return cleanField;
    });
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
